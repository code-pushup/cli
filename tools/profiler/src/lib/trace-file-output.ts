import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { LineOutputError, createLineFileOutput } from './line-file-output.js';
import {
  getCompleteEvent,
  getStartTracing,
  getTimingEventInstant,
  getTimingEventSpan,
  relativeToAbsuloteTime,
} from './trace-file-utils';
import type { InstantEvent, SpanEvent, TraceEvent } from './trace-file.type';
import type { UserTimingDetail } from './user-timing-details.type';

/**
 * Get the intermediate file path for a given final file path.
 * Used for output formats where data is written to an intermediate file
 * and then converted to the final format.
 */
export function getIntermediatePath(
  finalPath: string,
  options?: {
    intermediateExtension?: string;
    finalExtension?: string;
  },
): string {
  const intermediateExtension = options?.intermediateExtension || '.jsonl';
  const finalExtension = options?.finalExtension || '.json';
  return finalPath.replace(
    new RegExp(`${finalExtension}$`),
    intermediateExtension,
  );
}

/**
 * @deprecated Use getIntermediatePath instead
 */
export function getJsonlPath(jsonPath: string): string {
  return getIntermediatePath(jsonPath, {
    intermediateExtension: '.jsonl',
    finalExtension: '.json',
  });
}

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

  /**
   * Return preamble events written at the start of tracing.
   */
  preamble(opt?: Record<string, unknown>): string[];

  encode(event: I, opt?: Record<string, unknown>): string[];

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
  readonly fileExt = 'jsonl';
  readonly filePath: string;

  #nextId2 = (() => {
    let counter = 1;
    return () => ({ local: `0x${counter++}` });
  })();

  #traceStartTs?: number;

  constructor(filePath: string, traceStartTs?: number) {
    this.filePath = filePath;
    this.#traceStartTs = traceStartTs;
  }

  get traceStartTs(): number | undefined {
    return this.#traceStartTs;
  }

  preamble(opt?: {
    pid: number;
    tid: number;
    url: string;
    traceStartTs?: number;
  }): string[] {
    const traceStartTs =
      opt?.traceStartTs ?? relativeToAbsuloteTime(this.#traceStartTs);
    const pid = opt?.pid ?? process.pid;
    const tid = opt?.tid ?? threadId;
    const url = opt?.url ?? this.filePath;
    return [
      JSON.stringify(
        getStartTracing({
          pid,
          tid,
          traceStartTs,
          url,
        }),
      ),
      JSON.stringify(
        getCompleteEvent(pid, tid, {
          ts: traceStartTs,
          dur: 10,
        }),
      ),
    ];
  }

  encode(event: ProfilingEvent, opt?: { pid: number; tid: number }): string[] {
    const ctx = {
      pid: opt?.pid ?? process.pid,
      tid: opt?.tid ?? threadId,
      nextId2: this.#nextId2,
    };

    switch (event.entryType) {
      case 'mark':
        return [JSON.stringify(markToTraceEvent(event, ctx))];
      case 'measure':
        return measureToTraceEvents(event, ctx).map(event =>
          JSON.stringify(event),
        );
      default:
        return [];
    }
  }

  epilogue(opt?: { pid: number; tid: number }): string[] {
    const pid = opt?.pid ?? process.pid;
    const tid = opt?.tid ?? threadId;
    return [
      JSON.stringify(
        getCompleteEvent(pid, tid, {
          ts: relativeToAbsuloteTime(),
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
 * Helper for MEASURE entries
 * - emits async begin/end (b/e)
 * - uses a simple incrementing id
 * - timestamps stay in ms
 */
export function measureToTraceEvents(
  entry: PerformanceMeasure,
  options: Pick<SpanEvent, 'pid' | 'tid' | 'ts'>,
): SpanEvent[] {
  const { ts, ...opts } = options;
  const absTs = relativeToAbsuloteTime(ts);
  return getTimingEventSpan(entry, { ...opts, ts: absTs });
}

/**
 * Helper for MARK entries
 * - emits an instant event (ph: i)
 * - timestamps stay in ms
 */
export function markToTraceEvent(
  entry: PerformanceMark,
  options: Pick<InstantEvent, 'pid' | 'tid' | 'ts'>,
): InstantEvent {
  return getTimingEventInstant({
    entry,
    name: entry.name,
    nextId2,
    ...options,
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

/**
 * Trace file interface for Chrome DevTools trace event files.
 * Provides file output functionality with trace-specific features like recovery.
 */
type TraceFileEvent =
  | TraceEvent
  | {
      type: 'fatal';
      pid: number;
      tid: number;
      tsMs: number;
      kind: string;
      error: unknown;
    }
  | {
      type: 'error';
      pid: number;
      tid: number;
      tsMs: number;
      message: string;
      error: unknown;
    };

export interface TraceFile {
  readonly filePath: string;
  readonly jsonlPath: string;

  write(obj: TraceFileEvent): void;

  writeImmediate(obj: TraceFileEvent): void;

  flush(): void;

  close(): void;

  /**
   * Recover from incomplete or corrupted trace files.
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
}): TraceFile {
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

  const lineOutput = createLineFileOutput<TraceFileEvent | string, unknown>({
    filePath: jsonlPath,
    flushEveryN,
    recoverExisting,
    // Parse JSON lines for recovery
    parse: (line: string) => JSON.parse(line),
    encode: (obj: TraceFileEvent | string) => {
      if (typeof obj === 'string') return [obj];
      return [JSON.stringify(obj)];
    },
  });

  return {
    filePath: jsonlPath,
    jsonlPath,

    write(obj: TraceFileEvent): void {
      if (closed) return;
      lineOutput.writeLine(obj);
    },

    writeImmediate(obj: TraceFileEvent): void {
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
          pid: process.pid,
          tid: threadId,
          url: filePath,
          ...(prologTs !== undefined && { traceStartTs: prologTs }),
        });

        const epilogEvents = outputFormat.epilogue({
          pid: process.pid,
          tid: threadId,
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
