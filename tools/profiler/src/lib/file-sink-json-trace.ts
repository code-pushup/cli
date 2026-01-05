import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { JsonlFileSink, recoverJsonlFile } from './file-sink-json.js';
import type { RecoverResult } from './sink.types.js';
import {
  getCompleteEvent,
  getStartTracing,
  traceTimestampToDate,
} from './trace-file-utils.js';
import type { InstantEvent, SpanEvent } from './trace-file.type.js';

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
  const startDate = traceTimestampToDate(firstTs);

  const traceEventsJson = [
    // Preamble
    JSON.stringify(
      getStartTracing({
        ts: startTs,
        url: 'trace.json',
      }),
    ),
    JSON.stringify(
      getCompleteEvent({
        ts: startTs,
        dur: 20,
      }),
    ),
    // Events
    ...events.map(event => JSON.stringify(event)),
    JSON.stringify(
      getCompleteEvent({
        ts: endTs,
        dur: 20,
      }),
    ),
  ].join(',\n');

  const jsonOutput = createTraceFileContent(
    traceEventsJson,
    startDate,
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
