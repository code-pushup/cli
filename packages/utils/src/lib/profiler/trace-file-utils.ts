import type {
  PerformanceEntry,
  PerformanceMark,
  PerformanceMeasure,
} from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { defaultClock } from '../clock-epoch.js';
import type { UserTimingDetail } from '../user-timing-extensibility-api.type.js';
import type {
  BeginEvent,
  CompleteEvent,
  EndEvent,
  InstantEvent,
  InstantEventArgs,
  InstantEventTracingStartedInBrowser,
  SpanEvent,
  SpanEventArgs,
  TraceEvent,
  TraceEventContainer,
  TraceEventRaw,
  TraceMetadata,
  UserTimingTraceEvent,
} from './trace-file.type.js';

/** Global counter for generating unique span IDs within a trace */
// eslint-disable-next-line functional/no-let
let id2Count = 0;

/**
 * Generates a unique ID for linking begin and end span events in Chrome traces.
 * @returns Object with local ID string for the id2 field
 */
export const nextId2 = () => ({ local: `0x${++id2Count}` });

/**
 * Provides default values for trace event properties.
 * @param opt - Optional overrides for pid, tid, and timestamp
 * @returns Object with pid, tid, and timestamp
 */
const defaults = (opt?: { pid?: number; tid?: number; ts?: number }) => ({
  pid: opt?.pid ?? process.pid,
  tid: opt?.tid ?? threadId,
  ts: opt?.ts ?? defaultClock.epochNowUs(),
});

/**
 * Generates a unique frame tree node ID from process and thread IDs.
 * @param pid - Process ID
 * @param tid - Thread ID
 * @returns Combined numeric ID
 */
export const frameTreeNodeId = (pid: number, tid: number) =>
  Number.parseInt(`${pid}0${tid}`, 10);

/**
 * Generates a frame name string from process and thread IDs.
 * @param pid - Process ID
 * @param tid - Thread ID
 * @returns Formatted frame name
 */
export const frameName = (pid: number, tid: number) => `FRAME0P${pid}T${tid}`;

/**
 * Creates an instant trace event for marking a point in time.
 * @param opt - Event configuration options
 * @returns InstantEvent object
 */
export const getInstantEvent = (opt: {
  name: string;
  ts?: number;
  pid?: number;
  tid?: number;
  args?: InstantEventArgs;
}): InstantEvent => ({
  cat: 'blink.user_timing',
  ph: 'i',
  name: opt.name,
  ...defaults(opt),
  args: opt.args ?? {},
});

/**
 * Creates a start tracing event with frame information.
 * This event is needed at the beginning of the traceEvents array to make tell the UI profiling has started, and it should visualize the data.
 * @param opt - Tracing configuration options
 * @returns StartTracingEvent object
 */
export const getInstantEventTracingStartedInBrowser = (opt: {
  url: string;
  ts?: number;
  pid?: number;
  tid?: number;
}): InstantEventTracingStartedInBrowser => {
  const { pid, tid, ts } = defaults(opt);
  const id = frameTreeNodeId(pid, tid);

  return {
    cat: 'devtools.timeline',
    ph: 'i',
    name: 'TracingStartedInBrowser',
    pid,
    tid,
    ts,
    args: {
      data: {
        frameTreeNodeId: id,
        frames: [
          {
            frame: frameName(pid, tid),
            isInPrimaryMainFrame: true,
            isOutermostMainFrame: true,
            name: '',
            processId: pid,
            url: opt.url,
          },
        ],
        persistentIds: true,
      },
    },
  };
};

/**
 * Creates a complete trace event with duration.
 * @param opt - Event configuration with name and duration
 * @returns CompleteEvent object
 */
export const getCompleteEvent = (opt: {
  name: string;
  dur: number;
  ts?: number;
  pid?: number;
  tid?: number;
}): CompleteEvent => ({
  cat: 'devtools.timeline',
  ph: 'X',
  name: opt.name,
  dur: opt.dur,
  ...defaults(opt),
  args: {},
});

/** Options for creating span events */
type SpanOpt = {
  name: string;
  id2: { local: string };
  ts?: number;
  pid?: number;
  tid?: number;
  args?: SpanEventArgs;
};

/**
 * Creates a begin span event.
 * @param ph - Phase ('b' for begin)
 * @param opt - Span event options
 * @returns BeginEvent object
 */
export function getSpanEvent(ph: 'b', opt: SpanOpt): BeginEvent;
/**
 * Creates an end span event.
 * @param ph - Phase ('e' for end)
 * @param opt - Span event options
 * @returns EndEvent object
 */
export function getSpanEvent(ph: 'e', opt: SpanOpt): EndEvent;
/**
 * Creates a span event (begin or end).
 * @param ph - Phase ('b' or 'e')
 * @param opt - Span event options
 * @returns SpanEvent object
 */
export function getSpanEvent(ph: 'b' | 'e', opt: SpanOpt): SpanEvent {
  return {
    cat: 'blink.user_timing',
    ph,
    name: opt.name,
    id2: opt.id2,
    ...defaults(opt),
    args: opt.args?.data?.detail
      ? { data: { detail: opt.args.data.detail } }
      : {},
  };
}

/**
 * Creates a pair of begin and end span events.
 * @param opt - Span configuration with start/end timestamps
 * @returns Tuple of BeginEvent and EndEvent
 */
export const getSpan = (opt: {
  name: string;
  tsB: number;
  tsE: number;
  id2?: { local: string };
  pid?: number;
  tid?: number;
  args?: SpanEventArgs;
  tsMarkerPadding?: number;
}): [BeginEvent, EndEvent] => {
  // tsMarkerPadding is here to make the measure slightly smaller so the markers align perfectly.
  // Otherwise, the marker is visible at the start of the measure below the frame
  //       No padding   Padding
  // spans: ========   |======|
  // marks: |      |
  const pad = opt.tsMarkerPadding ?? 1;
  // b|e need to share the same id2
  const id2 = opt.id2 ?? nextId2();

  return [
    getSpanEvent('b', {
      ...opt,
      id2,
      ts: opt.tsB + pad,
    }),
    getSpanEvent('e', {
      ...opt,
      id2,
      ts: opt.tsE - pad,
    }),
  ];
};

/**
 * Converts a PerformanceMark to an instant trace event.
 * @param entry - Performance mark entry
 * @param opt - Optional overrides for name, pid, and tid
 * @returns InstantEvent object
 */
export const markToInstantEvent = (
  entry: PerformanceMark,
  opt?: { name?: string; pid?: number; tid?: number },
): InstantEvent =>
  getInstantEvent({
    ...opt,
    name: opt?.name ?? entry.name,
    ts: defaultClock.fromEntry(entry),
    args: entry.detail ? { detail: entry.detail } : undefined,
  });

/**
 * Converts a PerformanceMeasure to a pair of span events.
 * @param entry - Performance measure entry
 * @param opt - Optional overrides for name, pid, and tid
 * @returns Tuple of BeginEvent and EndEvent
 */
export const measureToSpanEvents = (
  entry: PerformanceMeasure,
  opt?: { name?: string; pid?: number; tid?: number },
): [BeginEvent, EndEvent] =>
  getSpan({
    ...opt,
    name: opt?.name ?? entry.name,
    tsB: defaultClock.fromEntry(entry),
    tsE: defaultClock.fromEntry(entry, true),
    args: entry.detail ? { data: { detail: entry.detail } } : undefined,
  });

/**
 * Converts a PerformanceEntry to an array of UserTimingTraceEvents.
 * A mark is converted to an instant event, and a measure is converted to a pair of span events.
 * Other entry types are ignored.
 * @param entry - Performance entry
 * @returns UserTimingTraceEvent[]
 */
export function entryToTraceEvents(
  entry: PerformanceEntry,
): UserTimingTraceEvent[] {
  if (entry.entryType === 'mark') {
    return [markToInstantEvent(entry as PerformanceMark)];
  }
  if (entry.entryType === 'measure') {
    return measureToSpanEvents(entry as PerformanceMeasure);
  }
  return [];
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

/**
 * Creates a complete trace file container with metadata.
 * @param opt - Trace file configuration
 * @returns TraceEventContainer with events and metadata
 */
export const getTraceFile = (opt: {
  traceEvents: TraceEvent[];
  startTime?: string;
  metadata?: Partial<TraceMetadata>;
}): TraceEventContainer => ({
  traceEvents: opt.traceEvents,
  displayTimeUnit: 'ms',
  metadata: getTraceMetadata(new Date(), opt.metadata),
});

function processDetail<T extends { detail?: unknown }>(
  target: T,
  processor: (detail: string | object) => string | object,
): T {
  if (
    target.detail != null &&
    (typeof target.detail === 'string' || typeof target.detail === 'object')
  ) {
    return { ...target, detail: processor(target.detail) };
  }
  return target;
}

export function decodeDetail(target: { detail: string }): UserTimingDetail {
  return processDetail(target, detail =>
    typeof detail === 'string'
      ? (JSON.parse(detail) as string | object)
      : detail,
  ) as UserTimingDetail;
}

export function encodeDetail(target: UserTimingDetail): UserTimingDetail {
  return processDetail(
    target as UserTimingDetail & { detail?: unknown },
    (detail: string | object) =>
      typeof detail === 'object'
        ? JSON.stringify(detail as UserTimingDetail)
        : detail,
  ) as UserTimingDetail;
}

export function decodeTraceEvent({
  args,
  ...rest
}: TraceEventRaw): UserTimingTraceEvent {
  if (!args) {
    return rest as UserTimingTraceEvent;
  }

  const processedArgs = decodeDetail(args as { detail: string });
  if ('data' in args && args.data && typeof args.data === 'object') {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
      ...rest,
      args: {
        ...processedArgs,
        data: decodeDetail(args.data as { detail: string }),
      },
    } as UserTimingTraceEvent;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ...rest, args: processedArgs } as UserTimingTraceEvent;
}

export function encodeTraceEvent({
  args,
  ...rest
}: UserTimingTraceEvent): TraceEventRaw {
  if (!args) {
    return rest as TraceEventRaw;
  }

  const processedArgs = encodeDetail(args as UserTimingDetail);
  if ('data' in args && args.data && typeof args.data === 'object') {
    const result: TraceEventRaw = {
      ...rest,
      args: {
        ...processedArgs,
        data: encodeDetail(args.data as UserTimingDetail),
      },
    };
    return result;
  }
  const result: TraceEventRaw = { ...rest, args: processedArgs };
  return result;
}
