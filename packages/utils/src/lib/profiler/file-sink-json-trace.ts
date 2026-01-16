import * as fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { JsonlFile } from '../file-sink.js';
import {
  decodeTraceEvent,
  getCompleteEvent,
  getInstantEventTracingStartedInBrowser,
  getTraceFile,
  getTraceMetadata,
} from './trace-file-utils.js';
import type {
  InstantEvent,
  SpanEvent,
  TraceEvent,
  TraceEventRaw,
  UserTimingTraceEvent,
} from './trace-file.type.js';

const TRACE_START_MARGIN_NAME = '[trace padding start]';
const TRACE_END_MARGIN_NAME = '[trace padding end]';
const TRACE_MARGIN_MS = 1000;
const TRACE_MARGIN_DURATION_MS = 20;

export type FinalizeTraceFileOptions = {
  startTime?: string | Date;
  marginMs?: number;
  marginDurMs?: number;
};

// eslint-disable-next-line max-lines-per-function
export function finalizeTraceFile(
  events: (SpanEvent | InstantEvent)[],
  outputPath: string,
  metadata?: Record<string, unknown>,
  options?: FinalizeTraceFileOptions,
): void {
  if (fs.existsSync(outputPath)) {
    try {
      const content = fs.readFileSync(outputPath, 'utf8');
      if (content.trim().length > 0) {
        return;
      }
    } catch {
      // Ignore errors when checking existing file content
    }
  }
  if (events.length === 0) {
    const startTime = options?.startTime
      ? typeof options.startTime === 'string'
        ? options.startTime
        : options.startTime.toISOString()
      : new Date().toISOString();

    const startDate = startTime ? new Date(startTime) : undefined;

    // Even for empty traces, add padding events for consistency
    const marginMs = options?.marginMs ?? TRACE_MARGIN_MS;
    const marginDurMs = options?.marginDurMs ?? TRACE_MARGIN_DURATION_MS;
    const fallbackTs = performance.now();
    const startTs = fallbackTs - marginMs;
    const endTs = fallbackTs + marginMs;

    const traceEvents: TraceEvent[] = [
      getInstantEventTracingStartedInBrowser({ ts: startTs, url: outputPath }),
      getCompleteEvent({
        name: TRACE_START_MARGIN_NAME,
        ts: startTs,
        dur: marginDurMs,
      }),
      getCompleteEvent({
        name: TRACE_END_MARGIN_NAME,
        ts: endTs,
        dur: marginDurMs,
      }),
    ];

    const traceContainer = {
      ...getTraceFile({
        traceEvents,
        startTime,
      }),
      metadata: getTraceMetadata(startDate, metadata),
    };

    fs.writeFileSync(outputPath, JSON.stringify(traceContainer), 'utf8');
    return;
  }

  const marginMs = options?.marginMs ?? TRACE_MARGIN_MS;
  const marginDurMs = options?.marginDurMs ?? TRACE_MARGIN_DURATION_MS;

  const sortedEvents = [...events].sort((a, b) => a.ts - b.ts);
  const fallbackTs = performance.now();
  const firstTs: number = sortedEvents.at(0)?.ts ?? fallbackTs;
  const lastTs: number = sortedEvents.at(-1)?.ts ?? fallbackTs;

  const startTs = firstTs - marginMs;
  const endTs = lastTs + marginMs;

  const traceEvents: TraceEvent[] = [
    getInstantEventTracingStartedInBrowser({ ts: startTs, url: outputPath }),
    getCompleteEvent({
      name: TRACE_START_MARGIN_NAME,
      ts: startTs,
      dur: marginDurMs,
    }),
    ...sortedEvents,
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

  const startDate = startTime ? new Date(startTime) : undefined;

  const traceContainer = {
    ...getTraceFile({
      traceEvents,
      startTime,
    }),
    metadata: getTraceMetadata(startDate, metadata),
  };

  fs.writeFileSync(outputPath, JSON.stringify(traceContainer), 'utf8');
}

export type TraceFileSinkOptions = {
  filename: string;
  directory: string;
  metadata?: Record<string, unknown>;
  startTime?: string | Date;
  marginMs?: number;
  marginDurMs?: number;
};

export class FileSinkJsonTrace extends JsonlFile<TraceEventRaw> {
  #metadata?: Record<string, unknown>;
  #startTime?: string | Date;
  #marginMs?: number;
  #marginDurMs?: number;
  #closed = false;

  constructor(opts: TraceFileSinkOptions) {
    const filePath = path.join(opts.directory, `${opts.filename}.jsonl`);
    super(filePath, JSON.stringify, JSON.parse);

    this.#metadata = opts.metadata;
    this.#startTime = opts.startTime;
    this.#marginMs = opts.marginMs;
    this.#marginDurMs = opts.marginDurMs;
  }
  #getFilePathForExt(ext: 'json' | 'jsonl'): string {
    return path.join(
      path.dirname(this.sink.getPath()),
      `${path.parse(this.sink.getPath()).name}.${ext}`,
    );
  }

  close(): void {
    if (this.#closed) {
      return;
    }
    this.finalize();
    this.#closed = true;
  }

  finalize(): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;

    // Close the sink if it's open
    if (!this.sink.isClosed()) {
      this.sink.close();
    }

    const { records } = this.recover();
    const outputPath = this.#getFilePathForExt('json');

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    finalizeTraceFile(
      records.map(r => decodeTraceEvent(r) as UserTimingTraceEvent),
      outputPath,
      this.#metadata,
      {
        startTime: this.#startTime,
        marginMs: this.#marginMs,
        marginDurMs: this.#marginDurMs,
      },
    );
  }
}
