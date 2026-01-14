import * as fs from 'node:fs';
// Exception: finalization creates new JSON file
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { JsonlFile, recoverJsonlFile } from './file-sink-jsonl.js';
import type { RecoverResult } from './sink-source.type.js';
import {
  decodeTraceEvent,
  encodeTraceEvent,
  getCompleteEvent,
  getInstantEventTracingStartedInBrowser,
} from './trace-file-utils.js';
import type {
  InstantEvent,
  SpanEvent,
  TraceEvent,
  TraceEventRaw,
} from './trace-file.type.js';

const TRACE_START_MARGIN_NAME = '[trace padding start]';
const TRACE_END_MARGIN_NAME = '[trace padding end]';
const TRACE_MARGIN_MS = 1000;
const TRACE_MARGIN_DURATION_MS = 20;

export type FinalizeTraceFileOptions = {
  marginMs?: number;
  marginDurMs?: number;
  startTime?: string | Date;
};

export function finalizeTraceFile(
  events: (SpanEvent | InstantEvent)[],
  outputPath: string,
  metadata?: Record<string, unknown>,
  options?: FinalizeTraceFileOptions,
): void {
  events.sort((a, b) => a.ts - b.ts);
  const fallbackTs = performance.now();
  const firstTs = events.length > 0 ? events[0].ts : fallbackTs;
  const lastTs = events.length > 0 ? events[events.length - 1].ts : fallbackTs;

  const marginMs = options?.marginMs ?? TRACE_MARGIN_MS;
  const marginDurMs = options?.marginDurMs ?? TRACE_MARGIN_DURATION_MS;

  const startTs = firstTs - marginMs;
  const endTs = lastTs + marginMs;

  const traceEvents: TraceEvent[] = [
    getInstantEventTracingStartedInBrowser({ ts: startTs, url: outputPath }),
    getCompleteEvent({
      name: TRACE_START_MARGIN_NAME,
      ts: startTs,
      dur: marginDurMs,
    }),
    ...events,
    getCompleteEvent({
      name: TRACE_END_MARGIN_NAME,
      ts: endTs,
      dur: marginDurMs,
    }),
  ];

  const startTime = options?.startTime
    ? typeof options.startTime === 'string'
      ? options.startTime
      : options.startTime.toISOString()
    : new Date().toISOString();

  fs.writeFileSync(
    outputPath,
    JSON.stringify({
      traceEvents,
      displayTimeUnit: 'ms',
      metadata: {
        source: 'DevTools',
        startTime,
        hardwareConcurrency: 1,
        dataOrigin: 'TraceEvents',
        ...metadata,
      },
    }),
    'utf8',
  );
}

export type TraceFileSinkOptions = {
  filename: string;
  directory?: string;
  metadata?: Record<string, unknown>;
  marginMs?: number;
  marginDurMs?: number;
  startTime?: string | Date;
};

export class FileSinkJsonTrace {
  readonly #directory: string;
  readonly #filename: string;
  readonly #metadata: Record<string, unknown> | undefined;
  readonly #marginMs?: number;
  readonly #marginDurMs?: number;
  readonly #startTime?: string | Date;
  private sink: JsonlFile<TraceEventRaw>;
  #finalized = false;

  constructor(opts: TraceFileSinkOptions) {
    const {
      filename,
      directory = '.',
      metadata,
      marginMs,
      marginDurMs,
      startTime,
    } = opts;
    const traceJsonlPath = path.join(directory, `${filename}.jsonl`);

    this.#directory = directory;
    this.#filename = filename;
    this.#metadata = metadata;
    this.#marginMs = marginMs;
    this.#marginDurMs = marginDurMs;
    this.#startTime = startTime;

    this.sink = new JsonlFile<TraceEventRaw>({
      filePath: traceJsonlPath,
      recover: () => recoverJsonlFile<TraceEventRaw>(traceJsonlPath),
      finalize: () => {
        const rawRecords = this.sink.recover().records;
        // Decode raw events to proper TraceEvent format for finalization
        const processedRecords = rawRecords.map(decodeTraceEvent);
        finalizeTraceFile(
          processedRecords as (SpanEvent | InstantEvent)[],
          this.getFilePathForExt('json'),
          this.#metadata,
          {
            marginMs: this.#marginMs,
            marginDurMs: this.#marginDurMs,
            startTime: this.#startTime,
          },
        );
      },
    });
  }

  /**
   * Open file for writing (no-op since JsonlFile opens lazily).
   */
  open(): void {
    // JsonlFile opens lazily on first write, so no-op here
  }

  write(input: SpanEvent | InstantEvent): void {
    const encodedEvent = encodeTraceEvent(input);
    this.sink.write(encodedEvent);
  }

  /**
   * Read all events (strict parsing - throws on invalid JSON).
   * For error-tolerant reading, use recover() instead.
   */
  readAll(): (SpanEvent | InstantEvent)[] {
    return this.sink.readAll().map(decodeTraceEvent) as (
      | SpanEvent
      | InstantEvent
    )[];
  }

  getFilePath(): string {
    return this.sink.getPath();
  }

  close(): void {
    this.sink.close();
  }

  recover(): RecoverResult<SpanEvent | InstantEvent> {
    const { records, errors, partialTail } = this.sink.recover();
    const processedRecords = records.map(decodeTraceEvent) as (
      | SpanEvent
      | InstantEvent
    )[];
    return { records: processedRecords, errors, partialTail };
  }

  finalize(): void {
    if (this.#finalized) return;
    this.#finalized = true;
    this.sink.finalize();
  }

  getFilePathForExt(ext: 'json' | 'jsonl'): string {
    return path.join(this.#directory, `${this.#filename}.${ext}`);
  }
}
