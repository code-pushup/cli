import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { JsonlFileSink, recoverJsonlFile } from './file-sink-jsonl.js';
import { getCompleteEvent, getStartTracing } from './trace-file-utils.js';
import type {
  InstantEvent,
  SpanEvent,
  TraceEvent,
  TraceEventRaw,
  UserTimingDetail,
} from './trace-file.type.js';

const tryJson = <T>(v: unknown): T | unknown => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v) as T;
  } catch {
    return v;
  }
};

const toJson = (v: unknown): unknown => {
  if (v === undefined) return undefined;
  try {
    return JSON.stringify(v);
  } catch {
    return v;
  }
};

export function decodeTraceEvent({ args, ...rest }: TraceEventRaw): TraceEvent {
  if (!args) return rest as TraceEvent;

  const out: any = { ...args };
  if ('detail' in out) out.detail = tryJson<UserTimingDetail>(out.detail);
  if (out.data?.detail)
    out.data.detail = tryJson<UserTimingDetail>(out.data.detail);

  return { ...rest, args: out } as TraceEvent;
}

export function encodeTraceEvent({ args, ...rest }: TraceEvent): TraceEventRaw {
  if (!args) return rest as TraceEventRaw;

  const out: any = { ...args };
  if ('detail' in out) out.detail = toJson(out.detail);
  if (out.data?.detail) out.data.detail = toJson(out.data.detail);

  return { ...rest, args: out } as TraceEventRaw;
}

function getTraceMetadata(
  startDate?: Date,
  metadata?: Record<string, unknown>,
) {
  return {
    source: 'DevTools',
    startTime: startDate?.toISOString() ?? new Date().toISOString(),
    hardwareConcurrency: 1,
    dataOrigin: 'TraceEvents',
    ...metadata,
  };
}

function createTraceFileContent(
  traceEventsContent: string,
  startDate?: Date,
  metadata?: Record<string, unknown>,
): string {
  return `{
  "metadata": ${JSON.stringify(getTraceMetadata(startDate, metadata))},
  "traceEvents": [
${traceEventsContent}
  ]
}`;
}

function finalizeTraceFile(
  events: (SpanEvent | InstantEvent)[],
  outputPath: string,
  metadata?: Record<string, unknown>,
): void {
  const { writeFileSync } = fs;

  const sortedEvents = events.sort((a, b) => a.ts - b.ts);
  const first = sortedEvents[0];
  const last = sortedEvents[sortedEvents.length - 1];

  // Use performance.now() as fallback when no events exist
  const fallbackTs = performance.now();
  const firstTs = first?.ts ?? fallbackTs;
  const lastTs = last?.ts ?? fallbackTs;

  // Add margins for readability
  const tsMargin = 1000;
  const startTs = firstTs - tsMargin;
  const endTs = lastTs + tsMargin;
  const startDate = new Date().toISOString();

  const traceEventsJson = [
    // Preamble
    encodeTraceEvent(
      getStartTracing({
        ts: startTs,
        url: outputPath,
      }),
    ),
    encodeTraceEvent(
      getCompleteEvent({
        ts: startTs,
        dur: 20,
      }),
    ),
    // Events
    ...events.map(encodeTraceEvent),
    encodeTraceEvent(
      getCompleteEvent({
        ts: endTs,
        dur: 20,
      }),
    ),
  ].join(',\n');

  const jsonOutput = createTraceFileContent(
    traceEventsJson,
    new Date(),
    metadata,
  );
  writeFileSync(outputPath, jsonOutput, 'utf8');
}

export interface TraceFileSinkOptions {
  filename: string;
  directory?: string;
  metadata?: Record<string, unknown>;
}

export class TraceFileSink extends JsonlFileSink<SpanEvent | InstantEvent> {
  readonly #filePath: string;
  readonly #getFilePathForExt: (ext: 'json' | 'jsonl') => string;
  readonly #metadata: Record<string, unknown> | undefined;

  constructor(opts: TraceFileSinkOptions) {
    const { filename, directory = '.', metadata } = opts;

    const traceJsonlPath = path.join(directory, `${filename}.jsonl`);

    super({
      filePath: traceJsonlPath,
      recover: () => recoverJsonlFile<SpanEvent | InstantEvent>(traceJsonlPath),
    });

    this.#metadata = metadata;
    this.#filePath = path.join(directory, `${filename}.json`);
    this.#getFilePathForExt = (ext: 'json' | 'jsonl') =>
      path.join(directory, `${filename}.${ext}`);
  }

  override finalize(): void {
    finalizeTraceFile(this.recover().records, this.#filePath, this.#metadata);
  }

  getFilePathForExt(ext: 'json' | 'jsonl'): string {
    return this.#getFilePathForExt(ext);
  }
}
