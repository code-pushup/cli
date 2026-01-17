import { performance } from 'node:perf_hooks';
import type { WalFormat } from '../wal.js';
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
 * WAL format for Chrome DevTools trace files.
 * Automatically finalizes shards into complete trace files with proper metadata.
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
    shardPath: (id: string) =>
      groupId
        ? `${baseName}.${groupId}.${id}${walExtension}`
        : `${baseName}.${id}${walExtension}`,
    finalPath: () =>
      groupId
        ? `${baseName}.${groupId}${finalExtension}`
        : `${baseName}${finalExtension}`,
    // eslint-disable-next-line functional/prefer-tacit
    finalizer: (
      records: UserTimingTraceEvent[],
      metadata?: Record<string, unknown>,
    ) => generateTraceContent(records, metadata),
  } satisfies WalFormat<T>;
};
