import os from 'node:os';
import type { PerformanceMark, PerformanceMeasure } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { defaultClock } from './clock-epoch.js';
import type {
  BeginEvent,
  CompleteEvent,
  EndEvent,
  InstantEvent,
  InstantEventArgs,
  SpanEvent,
  SpanEventArgs,
  StartTracingEvent,
  TraceEvent,
  TraceEventContainer,
} from './trace-file.type.js';

/** Global counter for generating unique local IDs */
// eslint-disable-next-line functional/no-let
let id2Count = 0;

/**
 * Generates a unique local ID for span events, to link start and end with a id.
 * @returns Object with local ID string
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
 * This event is needed to make events in general show up and also colores the track better.
 * @param opt - Tracing configuration options
 * @returns StartTracingEvent object
 */
export const getStartTracing = (opt: {
  url: string;
  ts?: number;
  pid?: number;
  tid?: number;
}): StartTracingEvent => {
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
 * Creates a complete trace file container with metadata.
 * @param opt - Trace file configuration
 * @returns TraceEventContainer with events and metadata
 */
export const getTraceFile = (opt: {
  traceEvents: TraceEvent[];
  startTime?: string;
}): TraceEventContainer => ({
  traceEvents: opt.traceEvents,
  displayTimeUnit: 'ms',
  metadata: {
    source: 'Node.js UserTiming',
    startTime: opt.startTime ?? new Date().toISOString(),
    hardwareConcurrency: os.cpus().length,
  },
});
