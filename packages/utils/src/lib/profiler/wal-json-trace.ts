import { performance } from 'node:perf_hooks';
import type { InvalidEntry, WalFormat } from '../wal.js';
import {
  decodeTraceEvent,
  encodeTraceEvent,
  getCompleteEvent,
  getInstantEventTracingStartedInBrowser,
  getTraceFile,
} from './trace-file-utils.js';
import type { TraceEvent, UserTimingTraceEvent } from './trace-file.type.js';

/** Name for the trace start margin event */
const TRACE_START_MARGIN_NAME = '[trace padding start]';
/** Name for the trace end margin event */
const TRACE_END_MARGIN_NAME = '[trace padding end]';
/** Milliseconds of padding to add before/after trace events */
const TRACE_MARGIN_MS = 1000;
/** Duration in milliseconds for margin events */
const TRACE_MARGIN_DURATION_MS = 20;

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

  const marginMs = TRACE_MARGIN_MS;
  const marginDurMs = TRACE_MARGIN_DURATION_MS;

  const sortedEvents = [...events].sort((a, b) => a.ts - b.ts);
  const fallbackTs = performance.now();
  const firstTs: number = sortedEvents.at(0)?.ts ?? fallbackTs;
  const lastTs: number = sortedEvents.at(-1)?.ts ?? fallbackTs;

  const startTs = firstTs - marginMs;
  const endTs = lastTs + marginMs;

  const traceEvents: TraceEvent[] = [
    getInstantEventTracingStartedInBrowser({
      ts: startTs,
      url: events.length === 0 ? 'empty-trace' : 'generated-trace',
    }),
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

  return JSON.stringify({ ...traceContainer, traceEvents });
}

/**
 * Creates a WAL (Write-Ahead Logging) format configuration for Chrome DevTools trace files.
 * Automatically finalizes shards into complete trace files with proper metadata and margin events.
 * @template T - Type of trace events, defaults to UserTimingTraceEvent
 * @param opt - Optional configuration for the WAL format
 * @param opt.dir - Optional directory for WAL files (not used in returned object)
 * @param opt.groupId - Optional group identifier for organizing trace files
 * @returns WalFormat configuration object with codec, paths, and finalizer
 */
export const traceEventWalFormat = <
  T extends UserTimingTraceEvent = UserTimingTraceEvent,
>(opt?: {
  dir?: string;
  groupId?: string;
}) => {
  const baseName = 'trace';
  const walExtension = '.jsonl';
  const finalExtension = '.json';
  const groupId = opt?.groupId;
  return {
    baseName,
    walExtension,
    finalExtension,
    codec: {
      encode: (event: UserTimingTraceEvent) =>
        JSON.stringify(encodeTraceEvent(event)),
      decode: (json: string) => decodeTraceEvent(JSON.parse(json)) as T,
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
  } satisfies WalFormat<T>;
};
