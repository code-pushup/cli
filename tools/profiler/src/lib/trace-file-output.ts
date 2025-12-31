import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { threadId } from 'node:worker_threads';
import { LineOutputError, createLineFileOutput } from './line-file-output.js';
import {
  entryToTraceTimestamp,
  getCompleteEvent,
  getInstantEvent,
  getStartTracing,
} from './trace-file-utils';
import type { InstantEvent, TraceEvent } from './trace-file.type';
import type { UserTimingDetail } from './user-timing-details.type';

export type ExtendedPerformanceMark = PerformanceMark & {
  detail?: UserTimingDetail;
};

export type ExtendedPerformanceMeasure = PerformanceMeasure & {
  detail?: UserTimingDetail;
};

/**
 * OutputFormat defines how to encode profiling events into output format.
 * Responsibilities:
 * - Define output schema and semantics
 * - Own all format-specific concepts (pid, tid, timestamps, url)
 * - Support multiple formats/versions
 */
export interface OutputFormat<I = unknown> {
  readonly id: string;
  readonly filePath: string;

  preamble(opt?: Record<string, unknown>): string[];

  epilogue(opt?: Record<string, unknown>): string[];
}

export type ProfilingEvent =
  | ExtendedPerformanceMark
  | ExtendedPerformanceMeasure;

/**
 * Chrome DevTools output format implementation.
 */
export class DevToolsOutputFormat implements OutputFormat<ProfilingEvent> {
  readonly id = 'devtools';
  readonly filePath: string;
  readonly #pid = process.pid;
  readonly #tid = threadId;

  #traceStartTs?: number;

  constructor(filePath: string, traceStartTs?: number) {
    this.filePath = filePath;
    this.#traceStartTs = traceStartTs;
  }

  get traceStartTs(): number | undefined {
    return this.#traceStartTs;
  }

  preamble(opt: { url: string; ts: number }): string[] {
    const { url = opt?.url ?? this.filePath, ts } = opt;
    return [
      JSON.stringify(
        getStartTracing({
          pid: this.#pid,
          tid: this.#tid,
          ts,
          url,
        }),
      ),
      JSON.stringify(
        getCompleteEvent({
          ts,
          dur: 10,
          pid: this.#pid,
          tid: this.#tid,
        }),
      ),
    ];
  }

  epilogue(opt: { ts: number }): string[] {
    return [
      JSON.stringify(
        getCompleteEvent({
          pid: this.#pid,
          tid: this.#tid,
          ...opt,
          dur: 10,
        }),
      ),
    ];
  }
}

const nextId = (() => {
  let counter = 1;
  return () => counter++;
})();

const nextId2 = (() => {
  let counter = 1;
  return () => ({ local: `0x${counter++}` });
})();

/**
 * Helper for MARK entries
 * - emits an instant event (ph: i)
 * - timestamps stay in ms
 */
export function markToTraceEvent(
  entry: PerformanceMark,
  options: Pick<InstantEvent, 'pid' | 'tid'>,
): InstantEvent {
  return getInstantEvent({
    ...options,
    name: entry.name,
    ts: entryToTraceTimestamp(entry),
    argsDataDetail: entry.detail,
  });
}

/**
 * Generate the complete JSON structure for a Chrome DevTools trace file.
 */
function createTraceJsonOutput(traceEventsContent: string): string {
  return `{
  "metadata": {
    "dataOrigin": "TraceEvents",
    "hardwareConcurrency": 1,
    "source": "DevTools",
    "startTime": "recovered-${new Date().toISOString()}"
  },
  "traceEvents": [
${traceEventsContent}
  ]
}`;
}

export interface FileOutput<T> {
  readonly filePath: string;
  readonly jsonlPath: string;

  write(obj: T): void;

  writeImmediate(obj: T): void;

  flush(): void;

  close(): void;

  /**
   * Recover from potentially incomplete or corrupted trace files.
   * Attempts to complete partial writes and convert to final format.
   */
  recover(): void;
}

/**
 * Create a TraceFile instance for handling Chrome DevTools trace event files.
 * Uses DevTools trace format encoding with recovery capabilities.
 */
export function createTraceFile(opts: {
  filename: string;
  directory?: string;
  flushEveryN?: number;
  recoverExisting?: boolean;
}): FileOutput<TraceEvent> {
  const {
    filename,
    directory = '.',
    flushEveryN = 20,
    recoverExisting = true,
  } = opts;

  const filePath = path.join(directory, `${filename}.json`);
  const jsonlPath = path.join(directory, `${filename}.jsonl`);

  // Ensure directory exists for JSONL file
  const dir = path.dirname(jsonlPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const outputFormat = new DevToolsOutputFormat(filePath);

  let preambleWritten = false;
  let closed = false;

  const ensurePreambleWritten = () => {
    if (!preambleWritten) {
      preambleWritten = true;
      // Preamble is written during recovery, not here
    }
  };

  const lineOutput = createLineFileOutput<TraceEvent | string, unknown>({
    filePath: jsonlPath,
    flushEveryN,
    recoverExisting,
    parse: (line: string) => JSON.parse(line),
    encode: (obj: TraceEvent | string) => {
      if (typeof obj === 'string') return [obj];
      return [JSON.stringify(obj)];
    },
  });
  const traceStartTs = performance.now();

  return {
    filePath: jsonlPath,
    jsonlPath,

    write(obj: TraceEvent): void {
      if (closed) return;
      lineOutput.writeLine(obj);
    },

    writeImmediate(obj: TraceEvent): void {
      if (closed) return;
      ensurePreambleWritten();
      lineOutput.writeLineImmediate(obj);
    },

    flush(): void {
      if (closed) return;
      lineOutput.flush();
    },

    close(): void {
      if (closed) return;
      closed = true;

      lineOutput.close();

      try {
        this.recover();
      } catch (error) {
        console.error('Error during file recovery on close:', error);
      }
    },

    recover(): void {
      try {
        const dir = path.dirname(filePath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        if (!existsSync(jsonlPath)) {
          const emptyOutput = createTraceJsonOutput('');
          writeFileSync(filePath, emptyOutput, 'utf8');
          return;
        }

        const validJsonl = readFileSync(jsonlPath, 'utf8');

        if (!validJsonl.trim()) {
          const emptyOutput = `{
  "metadata": {
    "dataOrigin": "TraceEvents",
    "hardwareConcurrency": 1,
    "source": "DevTools",
    "startTime": "recovered-${new Date().toISOString()}"
  },
  "traceEvents": []
}`;
          writeFileSync(filePath, emptyOutput, 'utf8');
          return;
        }

        const events = validJsonl
          .trim()
          .split('\n')
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(event => event && typeof event.ts === 'number');

        const earliestTs =
          events.length > 0 ? Math.min(...events.map(e => e.ts)) : 0;
        const latestTs =
          events.length > 0 ? Math.max(...events.map(e => e.ts)) : 0;

        const storedTraceStartTs = (outputFormat as any).traceStartTs;
        const prologTs =
          storedTraceStartTs ??
          (events.length > 0 ? Math.max(0, earliestTs - 20) : undefined);

        const prologEvents = outputFormat.preamble({
          ts: Math.min(earliestTs, traceStartTs),
          url: filePath,
          ...(prologTs !== undefined && { traceStartTs: prologTs }),
        });

        const epilogEvents = outputFormat.epilogue({
          ts: latestTs,
        });

        const adjustedEpilogEvents = epilogEvents.map(eventStr => {
          try {
            const event = JSON.parse(eventStr);
            if (event.ts && event.ts < latestTs) {
              event.ts = latestTs + 10; // Place 10 units after the last perf event
            }
            return JSON.stringify(event);
          } catch {
            return eventStr;
          }
        });

        let traceEventsContent = '';

        if (prologEvents.length > 0) {
          traceEventsContent +=
            prologEvents.map(event => `      ${event}`).join(',\n') + ',\n';
        }

        if (validJsonl) {
          const trimmedJsonl = validJsonl.trim();
          if (trimmedJsonl) {
            traceEventsContent +=
              '      ' + trimmedJsonl.replace(/\n/g, ',\n      ');
            if (adjustedEpilogEvents.length > 0) {
              traceEventsContent += ',\n';
            } else {
              traceEventsContent += '\n';
            }
          }
        }

        if (adjustedEpilogEvents.length > 0) {
          for (let i = 0; i < adjustedEpilogEvents.length; i++) {
            traceEventsContent += `      ${adjustedEpilogEvents[i]}`;
            if (i < adjustedEpilogEvents.length - 1) {
              traceEventsContent += ',\n';
            }
          }
        }

        const jsonOutput = createTraceJsonOutput(traceEventsContent);

        writeFileSync(filePath, jsonOutput, 'utf8');

        try {
          JSON.parse(jsonOutput);
        } catch (parseError) {
          throw new LineOutputError(
            `Recovery produced invalid JSON in file "${filePath}"`,
            parseError as Error,
          );
        }
      } catch (error) {
        throw new LineOutputError(
          `Failed to recover trace file "${filePath}"`,
          error as Error,
        );
      }
    },
  };
}
