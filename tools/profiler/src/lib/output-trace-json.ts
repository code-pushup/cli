import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  createJsonlFileOutput,
  jsonlDecode,
  jsonlEncode,
  recoverJsonlFileSync,
} from './output-jsonl.js';
import { FileSink } from './output.js';
import {
  getCompleteEvent,
  getStartTracing,
  traceTimestampToDate,
} from './trace-file-utils';
import { InstantEvent, SpanEvent } from './trace-file.type';

/**
 * Generate Chrome DevTools trace metadata
 */
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

/**
 * Generate the complete JSON structure for a Chrome DevTools trace file.
 */
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

/**
 * Recover trace events from a JSONL file
 */
function recoverTraceEvents(jsonlPath: string): (SpanEvent | InstantEvent)[] {
  return recoverJsonlFileSync<SpanEvent | InstantEvent>(jsonlPath).records;
}

function finalizeTraceFile(
  events: (SpanEvent | InstantEvent)[],
  outputPath: string,
  metadata?: Record<string, unknown>,
): void {
  const { writeFileSync } = fs;
  const pid = process.pid;
  const tid = (globalThis as any).threadId || 0;

  // Find first and last events by timestamp
  const sortedEvents = events.sort((a, b) => a.ts - b.ts);
  const first = sortedEvents[0];
  const last = sortedEvents[sortedEvents.length - 1];

  if (!first || !last) {
    throw new Error('No events to finalize');
  }

  // Add margins for readability
  const tsMargin = 1000;
  const startTs = first.ts - tsMargin;
  const endTs = last.ts + tsMargin;
  const startDate = traceTimestampToDate(first.ts);

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

/**
 * Create a complete Chrome DevTools trace file from JSONL data
 */
export class TraceFileSink
  extends FileSink<SpanEvent | InstantEvent>
  implements TraceFileOutput
{
  readonly #filePath: string;
  readonly #getFilePathForExt: (ext: 'json' | 'jsonl') => string;
  readonly #finalizeFn: () => void;

  constructor(opts: {
    filename: string;
    directory?: string;
    recoverJsonl?: boolean;
    metadata?: Record<string, unknown>;
  }) {
    const { filename, directory = '.', recoverJsonl, metadata } = opts;

    const traceJsonlPath = path.join(directory, `${filename}.jsonl`);

    super({
      filePath: traceJsonlPath,
      encode: jsonlEncode<SpanEvent | InstantEvent>,
      decode: jsonlDecode<SpanEvent | InstantEvent>,
      recover: () =>
        recoverJsonl
          ? recoverJsonlFileSync<SpanEvent | InstantEvent>(traceJsonlPath)
          : { records: [], errors: [], partialTail: null },
    });

    this.#filePath = path.join(directory, `${filename}.json`);
    this.#getFilePathForExt = (ext: 'json' | 'jsonl') =>
      path.join(directory, `${filename}.${ext}`);
    this.#finalizeFn = () =>
      finalizeTraceFile(
        recoverTraceEvents(traceJsonlPath),
        this.#filePath,
        metadata,
      );
  }

  // TraceFileOutput interface methods - override FileSink.finalize
  finalize(): void {
    this.#finalizeFn();
  }

  getFilePathForExt(ext: 'json' | 'jsonl'): string {
    return this.#getFilePathForExt(ext);
  }
}
