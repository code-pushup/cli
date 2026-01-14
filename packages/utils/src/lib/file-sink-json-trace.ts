import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  JsonlFileSink,
  jsonlDecode,
  jsonlEncode,
  recoverJsonlFile,
} from './file-sink-jsonl.js';
import { getCompleteEvent, getStartTracing } from './trace-file-utils.js';
import type {
  InstantEvent,
  SpanEvent,
  TraceEvent,
  TraceEventRaw,
  UserTimingDetail,
} from './trace-file.type.js';

export function decodeDetail(target: UserTimingDetail): UserTimingDetail {
  if (typeof target.detail === 'string') {
    return { ...target, detail: jsonlDecode<UserTimingDetail>(target.detail) };
  }
  return target;
}

export function encodeDetail(target: UserTimingDetail): UserTimingDetail {
  if (target.detail && typeof target.detail === 'object') {
    return {
      ...target,
      detail: jsonlEncode(target.detail as UserTimingDetail),
    };
  }
  return target;
}

export function decodeTraceEvent({ args, ...rest }: TraceEventRaw): TraceEvent {
  if (!args) return rest as TraceEvent;

  const out: UserTimingDetail = { ...args };
  const processedOut = decodeDetail(out);

  return {
    ...rest,
    args:
      out.data && typeof out.data === 'object'
        ? {
            ...processedOut,
            data: decodeDetail(out.data as UserTimingDetail),
          }
        : processedOut,
  };
}

export function encodeTraceEvent({ args, ...rest }: TraceEvent): TraceEventRaw {
  if (!args) return rest as TraceEventRaw;

  const out: UserTimingDetail = { ...args };
  const processedOut = encodeDetail(out);

  return {
    ...rest,
    args:
      out.data && typeof out.data === 'object'
        ? {
            ...processedOut,
            data: encodeDetail(out.data as UserTimingDetail),
          }
        : processedOut,
  };
}

export function getTraceMetadata(
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

export function finalizeTraceFile(
  events: (SpanEvent | InstantEvent)[],
  outputPath: string,
  metadata?: Record<string, unknown>,
): void {
  const { writeFileSync } = fs;

  if (events.length === 0) {
    return;
  }

  const sortedEvents = events.sort((a, b) => a.ts - b.ts);
  const first = sortedEvents[0];
  const last = sortedEvents[sortedEvents.length - 1];

  const fallbackTs = performance.now();
  const firstTs = first?.ts ?? fallbackTs;
  const lastTs = last?.ts ?? fallbackTs;

  const tsMargin = 1000;
  const startTs = firstTs - tsMargin;
  const endTs = lastTs + tsMargin;

  const traceEventsJson = [
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
    ...events.map(encodeTraceEvent),
    encodeTraceEvent(
      getCompleteEvent({
        ts: endTs,
        dur: 20,
      }),
    ),
  ]
    .map(event => JSON.stringify(event))
    .join(',\n');

  const jsonOutput = createTraceFileContent(
    traceEventsJson,
    new Date(),
    metadata,
  );
  writeFileSync(outputPath, jsonOutput, 'utf8');
}

export type TraceFileSinkOptions = {
  filename: string;
  directory?: string;
  metadata?: Record<string, unknown>;
};

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
