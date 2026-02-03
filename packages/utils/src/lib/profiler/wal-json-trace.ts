import { defaultClock } from '../clock-epoch.js';
import type { InvalidEntry, WalFormat } from '../wal.js';
import { PROFILER_PERSIST_BASENAME } from './constants.js';
import {
  complete,
  createTraceFile,
  deserializeTraceEvent,
  encodeEvent,
  getInstantEventTracingStartedInBrowser,
  serializeTraceEvent,
} from './trace-file-utils.js';
import type { TraceEvent } from './trace-file.type.js';

/** Name for the trace start margin event */
const TRACE_START_MARGIN_NAME = '[trace padding start]';
/** Name for the trace end margin event */
const TRACE_END_MARGIN_NAME = '[trace padding end]';
/** Microseconds of padding to add before/after trace events (1000ms = 1,000,000μs) */
const TRACE_MARGIN_US = 1_000_000;
/** Duration in microseconds for margin events (20ms = 20,000μs) */
const TRACE_MARGIN_DURATION_US = 20_000;

export function generateTraceContent(
  events: TraceEvent[],
  metadata?: Record<string, unknown>,
): string {
  const traceContainer = createTraceFile({
    traceEvents: events,
    startTime: new Date().toISOString(),
    metadata: {
      ...metadata,
      generatedAt: new Date().toISOString(),
    },
  });

  const fallbackTs = defaultClock.epochNowUs();
  const sortedEvents =
    events.length > 0 ? [...events].sort((a, b) => a.ts - b.ts) : [];

  const firstTs = sortedEvents.at(0)?.ts ?? fallbackTs;
  const lastTs = sortedEvents.at(-1)?.ts ?? fallbackTs;

  return JSON.stringify({
    ...traceContainer,
    traceEvents: [
      getInstantEventTracingStartedInBrowser({
        ts: firstTs - TRACE_MARGIN_US,
        url: events.length > 0 ? 'generated-trace' : 'empty-trace',
      }),
      complete(TRACE_START_MARGIN_NAME, TRACE_MARGIN_DURATION_US, {
        ts: firstTs - TRACE_MARGIN_US,
      }),
      ...sortedEvents.map(encodeEvent),
      complete(TRACE_END_MARGIN_NAME, TRACE_MARGIN_DURATION_US, {
        ts: lastTs + TRACE_MARGIN_US,
      }),
    ],
  });
}

/**
 * Codec for encoding and decoding trace events.
 * Encodes nested objects in args.detail and args.data.detail to JSON strings for storage.
 */
export const traceEventCodec = {
  encode: serializeTraceEvent,
  decode: deserializeTraceEvent,
};

/**
 * Creates a WAL (Write-Ahead Logging) format configuration for Chrome DevTools trace files.
 * Automatically finalizes shards into complete trace files with proper metadata and margin events.
 * @returns WalFormat configuration object with baseName, codec, extensions, and finalizer
 */
export function traceEventWalFormat() {
  return {
    baseName: PROFILER_PERSIST_BASENAME,
    walExtension: '.jsonl',
    finalExtension: '.json',
    codec: traceEventCodec,
    finalizer: (
      records: (TraceEvent | InvalidEntry<string>)[],
      metadata?: Record<string, unknown>,
    ) =>
      generateTraceContent(
        records.filter((r): r is TraceEvent => !('__invalid' in (r as object))),
        metadata,
      ),
  } satisfies WalFormat<TraceEvent>;
}
