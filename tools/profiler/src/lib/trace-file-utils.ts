import { performance } from 'node:perf_hooks';
import { type PerformanceMark, type PerformanceMeasure } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { clock } from './clock.js';
import { defaultTrack } from './performance-utils';
import type { ProfilerInterface } from './profiler';
import {
  type BaseTraceEventOptions,
  type BeginEvent,
  type CompleteEvent,
  type EndEvent,
  type InstantEvent,
  type TraceEvent,
} from './trace-file.type';
import {
  errorToEntryMeta,
  errorToTrackEntryPayload,
  markerPayload,
  trackEntryPayload,
} from './user-timing-details-utils';
import {
  type DevToolsColor,
  type DevToolsPayload,
  type EntryMeta,
  type MarkerPayload,
  type TrackEntryPayload,
  type UserTimingDetail,
} from './user-timing-details.type';

// Create a default clock instance for trace timestamp conversions
const defaultClock = clock();

/**
 * Converts a Chrome trace format timestamp back to a Date object.
 *
 * @param traceTimeUs - Timestamp in microseconds from Chrome trace format
 * @returns Date object representing the timestamp
 */
export function traceTimeToDate(traceTimeUs: number): Date {
  // Convert trace microseconds back to epoch microseconds, then to Date
  const epochUs = defaultClock.traceZeroEpochUs + traceTimeUs;
  return new Date(epochUs / 1000);
}

/**
 * Converts a performance entry's timestamp to Chrome trace format timestamp in microseconds.
 *
 * @param entry - Performance entry (mark, measure) containing startTime and potential duration
 * @param asEndTime - Optional flag to calculate end time for measures
 * @returns Timestamp in microseconds, aligned with Chrome trace format
 */
export function entryToTraceTimestamp(
  entry: PerformanceEntry,
  asEndTime: boolean = false,
): number {
  const performanceTime =
    entry.startTime +
    (entry.entryType === 'measure' && asEndTime ? entry.duration : 0);
  return defaultClock.fromPerfMs(performanceTime);
}

/**
 * Converts a Chrome trace format timestamp back to a Date object.
 *
 * @param traceTimestamp - Timestamp in microseconds from Chrome trace format
 * @returns Date object representing the timestamp
 */
export const traceTimestampToDate = traceTimeToDate;

export const nextId2 = (() => {
  let counter = 1;
  return () => ({ local: `0x${counter++}` });
})();

/**
 * Helper to get common trace event defaults
 */
function getTraceEventDefaults(opt: BaseTraceEventOptions) {
  return {
    pid: opt.pid ?? process.pid,
    tid: opt.tid ?? threadId,
    ts: opt.ts ?? defaultClock.fromPerfMs(performance.now()),
  };
}

/**
 * Specific options for span events
 */
interface SpanEventOptions extends BaseTraceEventOptions {
  name: string;
  id2: { local: string };
  args?: SpanEventArgs;
}

/**
 * Specific options for complete events
 */
interface CompleteEventOptions extends BaseTraceEventOptions {
  dur: number;
}

/**
 * Specific options for start tracing events
 */
interface StartTracingOptions extends BaseTraceEventOptions {
  url: string;
}

export function markToEventInstant(
  entry: PerformanceMark,
  options: {
    name: string;
    pid: number;
    tid: number;
  },
): InstantEvent {
  return getInstantEvent({
    ...options,
    ts: defaultClock.fromEntryStartTimeMs(entry.startTime),
    args: {
      data: {
        detail: {
          devtools: (entry.detail as UserTimingDetail)?.devtools,
        },
      },
    },
  });
}

export type InstantEventArgs = {
  data?: {
    detail?: UserTimingDetail;
  };
};

export function decodeInstantArgs(args?: InstantEventArgs) {
  const detail = args?.data?.detail as DevToolsPayload | undefined;
  return {
    data: {
      detail: detail ? JSON.stringify(detail) : undefined,
    },
  };
}

export function getInstantEvent(options: {
  name: string;
  ts?: number;
  pid?: number;
  tid?: number;
  args?: InstantEventArgs;
}): InstantEvent {
  const { pid, tid, ts } = getTraceEventDefaults(options);
  const { args, name } = options;

  return {
    cat: 'blink.user_timing',
    s: 't', // Timeline scope,
    ph: 'I', // Uppercase I for instant events in Chrome DevTools format
    name,
    pid,
    tid,
    ts,
    args: decodeInstantArgs(args),
  };
}

/**
 * Helper for Error Mark entries
 * - emits an instant event (ph: i)
 * - timestamps stay in ms
 */
export function errorToInstantEvent(
  error: unknown,
  options: {
    name: string;
    pid?: number;
    tid?: number;
    ts?: number;
  },
): InstantEvent {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const { pid, tid, ts } = getTraceEventDefaults(options);
  const { name } = options;

  return getInstantEvent({
    ...options,
    pid,
    tid,
    ts,
    name: `err-${errorName}`,
  });
}

export type SpanEventArgs = {
  detail?: UserTimingDetail;
};

export function getSpanEventArgsPayload(args?: SpanEventArgs) {
  return {
    ...(args?.detail ? { detail: JSON.stringify(args.detail) } : {}),
  };
}

export function getSpanEvent(ph: 'b', opt: SpanEventOptions): BeginEvent;
export function getSpanEvent(ph: 'e', opt: SpanEventOptions): EndEvent;
export function getSpanEvent(
  ph: 'b' | 'e',
  opt: SpanEventOptions,
): BeginEvent | EndEvent {
  const { name, id2, args } = opt;

  const baseEvent = {
    cat: 'blink.user_timing',
    s: 't',
    ph,
    name,
    ...getTraceEventDefaults(opt),
    id2,
    args: getSpanEventArgsPayload(args),
  };

  return baseEvent as BeginEvent | EndEvent;
}

// Convert performance measure to span events
export function getSpan(options: {
  tsB: number;
  tsE: number;
  name: string;
  id2?: { local: string };
  pid?: number;
  tid?: number;
  args?: SpanEventArgs;
}): [BeginEvent, EndEvent] {
  // make the measure slightly smaller so the markers align perfectly.
  // Otherwise, the marker is visible at the start of the measure below the frame
  //
  //        No padding     Padding
  // spans: ========      |======|
  // marks: |      |
  const tsMarkerPadding = 1;

  const { tsB, tsE, name, id2: id2Param, args } = options;
  const id2 = id2Param ?? nextId2();

  const begin = getSpanEvent('b', {
    ...options,
    name,
    id2,
    ts: tsB + tsMarkerPadding,
    args,
  }) as BeginEvent;

  const end = getSpanEvent('e', {
    ...options,
    name,
    id2,
    ts: tsE - tsMarkerPadding,
    args,
  }) as EndEvent;

  return [begin, end];
}

export function measureToSpanEvents(
  entry: PerformanceMeasure,
  options: {
    pid?: number;
    tid?: number;
  } = {},
): [BeginEvent, EndEvent] {
  // make the measure slightly smaller so the markers align perfectly.
  // Otherwise, the marker is visible at the start of the measure below the frame
  //
  //        No padding     Padding
  // spans: ========      |======|
  // marks: |      |
  const tsMarkerPadding = 1;
  const startUs = entryToTraceTimestamp(entry) + tsMarkerPadding;
  const endUs = entryToTraceTimestamp(entry, true) - tsMarkerPadding;

  const name = entry.name;
  const id2 = nextId2();

  const begin = getSpanEvent('b', {
    ...options,
    name,
    id2,
    ts: startUs,
    args: {
      ...(entry?.detail
        ? {
            detail: { devtools: (entry?.detail as UserTimingDetail)?.devtools },
          }
        : {}),
    },
  }) as BeginEvent;

  const end = getSpanEvent('e', {
    ...options,
    name,
    id2,
    ts: endUs,
    args: {
      ...(entry?.detail
        ? {
            detail: { devtools: (entry?.detail as UserTimingDetail)?.devtools },
          }
        : {}),
    },
  }) as EndEvent;

  return [begin, end];
}

export function getFrameTreeNodeId(pid: number, tid: number): number {
  return Number.parseInt(`${pid}0${tid}`);
}

export function getFrameName(pid: number, tid: number): string {
  return `FRAME0P${pid}T${tid}`;
}

export function getStartTracing(opt: StartTracingOptions): TraceEvent {
  const { pid, tid, ts } = getTraceEventDefaults(opt);
  const { url } = opt;
  const frameTreeNodeId = getFrameTreeNodeId(pid, tid);
  return {
    cat: 'devtools.timeline',
    s: 't',
    ph: 'I',
    name: 'TracingStartedInBrowser',
    pid,
    tid,
    ts,
    args: {
      data: {
        frameTreeNodeId,
        frames: [
          {
            frame: getFrameName(pid, tid),
            isInPrimaryMainFrame: true,
            isOutermostMainFrame: true,
            name: '',
            processId: pid,
            url,
          },
        ],
        persistentIds: true,
      },
    },
  };
}

export function getCompleteEvent(opt: CompleteEventOptions): CompleteEvent {
  const { dur, ...rest } = opt;
  return {
    cat: 'devtools.timeline',
    ph: 'X',
    name: 'RunTask',
    ...getTraceEventDefaults(rest),
    dur,
    args: {},
  };
}

const instantEventTrackEntry = (opt: {
  name: string;
  ts?: number;
  devtools: TrackEntryPayload;
}) => {
  const { devtools, ...traceProps } = opt;
  return getInstantEvent({
    ...traceProps,
    args: {
      data: {
        detail: { devtools: trackEntryPayload(devtools) },
      },
    },
  });
};

function errorToInstantEventTrackEntry(
  error: unknown,
  options?: { name: string; errorColor?: DevToolsColor } & Omit<
    TrackEntryPayload,
    'dataType'
  >,
): InstantEvent {
  const { name, errorColor = 'error', ...meta } = options ?? {};
  return instantEventTrackEntry({
    name: name ?? (error instanceof Error ? error.name : 'UnknownError'),
    devtools: trackEntryPayload({
      track: 'Program',
      color: errorColor,
      ...errorToEntryMeta(error, meta),
    }),
  });
}
