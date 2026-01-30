import { defaultClock } from '../clock-epoch.js';
import type { InvalidEntry, WalFormat } from '../wal.js';
import {
  decodeTraceEvent,
  encodeTraceEvent,
  getCompleteEvent,
  getInstantEventTracingStartedInBrowser,
  getTraceFile,
} from './trace-file-utils.js';
import type {
  TraceEvent,
  TraceEventRaw,
  UserTimingTraceEvent,
} from './trace-file.type.js';

/** Name for the trace start margin event */
const TRACE_START_MARGIN_NAME = '[trace padding start]';
/** Name for the trace end margin event */
const TRACE_END_MARGIN_NAME = '[trace padding end]';
/** Microseconds of padding to add before/after trace events (1000ms = 1,000,000μs) */
const TRACE_MARGIN_US = 1_000_000;
/** Duration in microseconds for margin events (20ms = 20,000μs) */
const TRACE_MARGIN_DURATION_US = 20_000;

/**
 * Generates a complete Chrome DevTools trace file content as JSON string.
 * Adds margin events around the trace events and includes metadata.
 * @param events - Array of user timing trace events to include
 * @param metadata - Optional custom metadata to include in the trace file
 * @returns JSON string representation of the complete trace file
 */
export function generateTraceContent(
  events: UserTimingTraceEvent[],
  metadata?: Record<string, unknown>,
): string {
  const traceContainer = getTraceFile({
    traceEvents: events,
    startTime: new Date().toISOString(),
    metadata: {
      ...metadata,
      generatedAt: new Date().toISOString(),
    },
  });

  const marginUs = TRACE_MARGIN_US;
  const marginDurUs = TRACE_MARGIN_DURATION_US;

  const sortedEvents = [...events].sort((a, b) => a.ts - b.ts);
  const fallbackTs = defaultClock.epochNowUs();
  const firstTs: number = sortedEvents.at(0)?.ts ?? fallbackTs;
  const lastTs: number = sortedEvents.at(-1)?.ts ?? fallbackTs;

  const startTs = firstTs - marginUs;
  const endTs = lastTs + marginUs;

  const traceEvents: TraceEvent[] = [
    getInstantEventTracingStartedInBrowser({
      ts: startTs,
      url: events.length === 0 ? 'empty-trace' : 'generated-trace',
    }),
    getCompleteEvent({
      name: TRACE_START_MARGIN_NAME,
      ts: startTs,
      dur: marginDurUs,
    }),
    ...sortedEvents.map(event => encodeTraceEvent(event) as TraceEvent),
    getCompleteEvent({
      name: TRACE_END_MARGIN_NAME,
      ts: endTs,
      dur: marginDurUs,
    }),
  ];

  return JSON.stringify({ ...traceContainer, traceEvents });
}

/**
 * Creates a WAL (Write-Ahead Logging) format configuration for Chrome DevTools trace files.
 * Automatically finalizes shards into complete trace files with proper metadata and margin events.
 * @returns WalFormat configuration object with baseName, codec, extensions, and finalizer
 */
export function traceEventWalFormat() {
  const baseName = 'trace';
  const walExtension = '.jsonl';
  const finalExtension = '.json';
  return {
    baseName,
    walExtension,
    finalExtension,
    codec: {
      encode: (event: UserTimingTraceEvent) =>
        JSON.stringify(encodeTraceEvent(event)),
      decode: (json: string) =>
        decodeTraceEvent(JSON.parse(json)) as UserTimingTraceEvent,
    },
    finalizer: (
      records: (UserTimingTraceEvent | InvalidEntry<string>)[],
      metadata?: Record<string, unknown>,
    ) => {
      const validRecords = records.filter(
        (r): r is UserTimingTraceEvent =>
          !(typeof r === 'object' && r != null && '__invalid' in r),
      );
      return generateTraceContent(validRecords, metadata);
    },
  } satisfies WalFormat<UserTimingTraceEvent>;
}
