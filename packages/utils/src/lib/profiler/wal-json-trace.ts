import { defaultClock } from '../clock-epoch.js';
import type { Codec, WalFormat, WalRecord } from '../wal.js';
import { PROFILER_PERSIST_BASENAME } from './constants.js';
import {
  complete,
  createTraceFile,
  deserializeTraceEvent,
  getInstantEventTracingStartedInBrowser,
  serializeTraceEvent,
} from './trace-file-utils.js';
import type { TraceEvent, TraceMetadata } from './trace-file.type.js';

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
  metadata?: Partial<TraceMetadata>,
): string {
  const fallbackTs = defaultClock.epochNowUs();
  const sortedEvents =
    events.length > 0 ? [...events].sort((a, b) => a.ts - b.ts) : [];

  const firstTs = sortedEvents.at(0)?.ts ?? fallbackTs;
  const lastTs = sortedEvents.at(-1)?.ts ?? fallbackTs;

  return JSON.stringify(
    createTraceFile({
      traceEvents: [
        getInstantEventTracingStartedInBrowser({
          ts: firstTs - TRACE_MARGIN_US,
          // TODO: add the stringifies command of the process that was traced when sharded WAL is implemented in profiler
          url: events.length > 0 ? 'generated-trace' : 'empty-trace',
        }),
        complete(TRACE_START_MARGIN_NAME, TRACE_MARGIN_DURATION_US, {
          ts: firstTs - TRACE_MARGIN_US,
        }),
        ...sortedEvents,
        complete(TRACE_END_MARGIN_NAME, TRACE_MARGIN_DURATION_US, {
          ts: lastTs + TRACE_MARGIN_US,
        }),
      ],
      metadata: {
        ...metadata,
        startTime: new Date(firstTs / 1000).toISOString(),
      },
    }),
  );
}

/**
 * Codec for encoding and decoding trace events.
 * Encodes nested objects in args.detail and args.data.detail to JSON strings for storage.
 * Decode returns TraceEvent; use with WalFormat<T, TraceEvent> when T extends TraceEvent.
 */
export const traceEventCodec: Codec<
  TraceEvent & WalRecord,
  string,
  TraceEvent
> = {
  encode: serializeTraceEvent,
  decode: deserializeTraceEvent,
};

/**
 * WAL format for Chrome DevTools trace files (codec decodes to TraceEvent).
 * Use getTraceEventWalFormat<T>() to get a format typed for subtype T.
 */
export const traceEventWalFormat: WalFormat<
  TraceEvent & WalRecord,
  TraceEvent
> = {
  baseName: PROFILER_PERSIST_BASENAME,
  walExtension: '.jsonl',
  finalExtension: '.json',
  codec: traceEventCodec,
  finalizer: generateTraceContent,
};

/**
 * Returns the default trace format for use when no custom format is passed.
 * Typed as WalFormat<T, TraceEvent> so it is assignable without casts when T extends TraceEvent.
 */
export function getTraceEventWalFormat<
  T extends TraceEvent & WalRecord,
>(): WalFormat<T, TraceEvent> {
  return traceEventWalFormat;
}
