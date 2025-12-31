import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { threadId } from 'node:worker_threads';
import { LineOutputError, createLineFileOutput } from './line-file-output.js';
import {
  entryToTraceTimestamp,
  getCompleteEvent,
  getInstantEvent,
  getStartTracing,
  traceTimestampToDate,
} from './trace-file-utils';
import type { InstantEvent, TraceEvent } from './trace-file.type';
import { createLabel } from './user-timing-details-utils';
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

export function getTraceMetadata(startDate?: Date) {
  return {
    source: 'DevTools',
    startTime: startDate?.toISOString() ?? new Date().toISOString(),
    hardwareConcurrency: 1,
    dataOrigin: 'TraceEvents',
  };
}

/**
 * Generate the complete JSON structure for a Chrome DevTools trace file.
 */
function createTraceFileContent(
  traceEventsContent: string,
  startDate?: Date,
): string {
  return `{
  "metadata": ${JSON.stringify(getTraceMetadata(startDate))},
  "traceEvents": [
${traceEventsContent}
  ]
}`;
}

/**
 * Parse JSONL lines into TraceEvent objects.
 * Handles both TraceEvent objects and PerformanceEntry objects that need conversion.
 */
function fromJsonLines(lines: string[]): {
  events: TraceEvent[];
  first: TraceEvent;
  last: TraceEvent;
} {
  const parsedLines: TraceEvent[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const parsed = JSON.parse(line);

      // Check if it's already a TraceEvent
      if (parsed && typeof parsed.ts === 'number') {
        parsedLines.push(parsed as TraceEvent);
        continue;
      }

      // Check if it's a PerformanceEntry that needs conversion
      if (parsed && parsed.entryType && typeof parsed.startTime === 'number') {
        // Convert PerformanceEntry to TraceEvent format
        const traceEvent = markToTraceEvent(parsed as ExtendedPerformanceMark, {
          pid: process.pid,
          tid: threadId,
        });
        parsedLines.push(traceEvent);
        continue;
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  if (parsedLines.length === 0) {
    throw new Error('No valid trace events found in JSONL content');
  }
  parsedLines.sort((a, b) => a.ts - b.ts);

  return {
    events: parsedLines,
    first: parsedLines[0]!,
    last: parsedLines[parsedLines.length - 1]!,
  };
}

export interface FileOutput<T> {
  readonly creation: number;
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
  const creation = performance.now();

  // Create empty file immediately so tests can check for its existence
  if (!existsSync(jsonlPath)) {
    writeFileSync(jsonlPath, '', 'utf8');
  }

  const initEmptyFile = () => {
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const emptyOutput = createTraceFileContent('');
    writeFileSync(filePath, emptyOutput, 'utf8');
  };

  return {
    filePath: jsonlPath,
    jsonlPath,
    creation,

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
        if (!existsSync(jsonlPath)) {
          initEmptyFile();
          return;
        }

        const rawJsonl = readFileSync(jsonlPath, 'utf8');
        const lines = rawJsonl.trim().split('\n');
        const { events, first, last } = fromJsonLines(lines);

        // To have nice readability of events close to the start and end, we attach a margin to the measures
        const tsMargin = 1000;
        const startTs = first.ts - tsMargin;
        const startDate = traceTimestampToDate(first.ts);

        const jsonOutput = createTraceFileContent(
          [
            ...outputFormat.preamble({
              ts: startTs,
              url: filePath,
            }),
            ...events.map(s => JSON.stringify(s)),
            ...outputFormat.epilogue({
              ts: last.ts + tsMargin,
            }),
          ].join(',\n'),
          startDate,
        );

        writeFileSync(filePath, jsonOutput, 'utf8');
      } catch (error) {
        throw new LineOutputError(
          `Failed to recover trace file "${filePath}"`,
          error as Error,
        );
      }
    },
  };
}
