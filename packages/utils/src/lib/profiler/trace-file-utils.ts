import type {
  PerformanceEntry,
  PerformanceMark,
  PerformanceMeasure,
} from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { defaultClock } from '../clock-epoch.js';
import type {
  TraceEvent,
  TraceEventContainer,
  TraceMetadata,
  TracingStartedInBrowserOptions,
} from './trace-file.type.js';

/**
 * Trace-local monotonic span id counter.
 * Chrome only requires uniqueness within a single trace file.
 * Resetting per trace is intentional - we're not aiming for global uniqueness.
 */
// eslint-disable-next-line functional/no-let
let id2Count = 0;

/**
 * Generates a unique ID for linking begin and end span events in Chrome traces.
 * @returns Object with local ID string for the id2 field
 */
export const nextId2 = () => ({ local: `0x${++id2Count}` });

/**
 * Generates a frame tree node ID from process and thread IDs.
 * @param pid - Process ID
 * @param tid - Thread ID
 * @returns Frame tree node ID as a number
 */
export const frameTreeNodeId = (pid: number, tid: number) =>
  Number.parseInt(`${pid}0${tid}`, 10);

/**
 * Generates a frame name from process and thread IDs.
 * @param pid - Process ID
 * @param tid - Thread ID
 * @returns Frame name string in format FRAME0P{pid}T{tid}
 */
export const frameName = (pid: number, tid: number) => `FRAME0P${pid}T${tid}`;

/**
 * Core factory for creating trace events with defaults.
 * @param opt - Partial trace event with required name and ph
 * @returns Complete TraceEvent with defaults applied
 */
const baseEvent = (
  opt: Partial<TraceEvent> & { name: string; ph: string },
): TraceEvent => ({
  cat: opt.cat ?? 'blink.user_timing',
  pid: opt.pid ?? process.pid,
  tid: opt.tid ?? threadId,
  ts: opt.ts ?? defaultClock.epochNowUs(),
  ...opt,
});

/**
 * Creates an instant trace event for marking a point in time.
 * @param name - Event name
 * @param ts - Optional timestamp in microseconds
 * @param opt - Optional event configuration
 * @returns Instant trace event (ph: 'I')
 */
export const instant = (
  name: string,
  ts?: number,
  opt?: Partial<TraceEvent>,
): TraceEvent => baseEvent({ name, ph: 'I', ts, ...opt });

/**
 * Creates a pair of begin and end span events.
 * @param name - Span name
 * @param tsB - Begin timestamp in microseconds
 * @param tsE - End timestamp in microseconds
 * @param opt - Optional event configuration
 * @param opt.tsMarkerPadding - Padding to apply to timestamps (default: 1)
 * @returns Array of [begin event, end event]
 */
export const span = (
  name: string,
  tsB: number,
  tsE: number,
  opt?: Partial<TraceEvent> & { tsMarkerPadding?: number },
): TraceEvent[] => {
  const id2 = opt?.id2 ?? nextId2();
  const pad = opt?.tsMarkerPadding ?? 1;
  const { tsMarkerPadding, ...eventOpt } = opt ?? {};
  const args = eventOpt.args ?? {};
  return [
    baseEvent({ name, ph: 'b', ts: tsB + pad, id2, ...eventOpt, args }),
    baseEvent({ name, ph: 'e', ts: tsE - pad, id2, ...eventOpt, args }),
  ];
};

/**
 * Creates a start tracing event with frame information.
 * This event is needed at the beginning of the traceEvents array to make tell the UI profiling has started, and it should visualize the data.
 * @param opt - Tracing configuration options
 * @returns StartTracingEvent object
 */
export const getInstantEventTracingStartedInBrowser = (
  opt: TracingStartedInBrowserOptions,
): TraceEvent => {
  const pid = opt.pid ?? process.pid;
  const tid = opt.tid ?? threadId;
  const ts = opt.ts ?? defaultClock.epochNowUs();

  return {
    cat: 'devtools.timeline',
    ph: 'i',
    name: 'TracingStartedInBrowser',
    pid,
    tid,
    ts,
    args: {
      data: {
        frameTreeNodeId: frameTreeNodeId(pid, tid),
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
      } satisfies Record<string, unknown>,
    },
  };
};

/**
 * Creates a complete trace event with duration.
 * @param name - Event name
 * @param dur - Duration in microseconds
 * @param opt - Optional event configuration
 * @returns Complete trace event (ph: 'X')
 */
export const complete = (
  name: string,
  dur: number,
  opt?: Partial<TraceEvent>,
): TraceEvent =>
  baseEvent({
    cat: 'devtools.timeline',
    ph: 'X',
    name,
    dur,
    args: {},
    ...opt,
  });

/**
 * Converts a PerformanceMark to an instant trace event.
 * @param entry - Performance mark entry
 * @param opt - Optional overrides for name, pid, and tid
 * @returns Instant trace event
 */
export const markToInstantEvent = (
  entry: PerformanceMark,
  opt?: { name?: string; pid?: number; tid?: number },
): TraceEvent =>
  instant(
    opt?.name ?? entry.name,
    defaultClock.fromEntry(entry),
    entry.detail
      ? { args: { data: { detail: entry.detail } }, ...opt }
      : { args: {}, ...opt },
  );

/**
 * Converts a PerformanceMeasure to a pair of span events.
 * @param entry - Performance measure entry
 * @param opt - Optional overrides for name, pid, and tid
 * @returns Array of [begin event, end event]
 */
export const measureToSpanEvents = (
  entry: PerformanceMeasure,
  opt?: { name?: string; pid?: number; tid?: number },
): TraceEvent[] =>
  span(
    opt?.name ?? entry.name,
    defaultClock.fromEntry(entry),
    defaultClock.fromEntry(entry, true),
    {
      ...opt,
      args: entry.detail ? { detail: entry.detail } : {},
    },
  );

/**
 * Converts a PerformanceEntry to an array of trace events.
 * A mark is converted to an instant event, and a measure is converted to a pair of span events.
 * Other entry types are ignored.
 * @param entry - Performance entry
 * @returns Array of trace events
 */
export function entryToTraceEvents(entry: PerformanceEntry): TraceEvent[] {
  if (entry.entryType === 'mark') {
    return [markToInstantEvent(entry as PerformanceMark)];
  }
  if (entry.entryType === 'measure') {
    return measureToSpanEvents(entry as PerformanceMeasure);
  }
  return [];
}

/**
 * Creates a mapper function for transforming detail properties in args.
 * @param fn - Transformation function to apply to detail values
 * @returns Function that maps args object
 */
const mapArgs = (fn: (v: unknown) => unknown) => (args?: TraceEvent['args']) =>
  args && {
    ...args,
    ...(args.detail != null && { detail: fn(args.detail) }),
    ...(args.data?.detail != null && {
      data: { ...args.data, detail: fn(args.data.detail) },
    }),
  };

/**
 * Encodes a trace event by converting object details to JSON strings.
 * @param e - Trace event with potentially object details
 * @returns Trace event with string-encoded details
 */
export const encodeEvent = (e: TraceEvent): TraceEvent => {
  const mappedArgs = mapArgs(d =>
    typeof d === 'object' ? JSON.stringify(d) : d,
  )(e.args);
  return {
    ...e,
    ...(mappedArgs && { args: mappedArgs }),
  };
};

/**
 * Decodes a trace event by parsing JSON string details back to objects.
 * @param e - Trace event with potentially string-encoded details
 * @returns Trace event with decoded object details
 */
export const decodeEvent = (e: TraceEvent): TraceEvent => {
  const mappedArgs = mapArgs(d => (typeof d === 'string' ? JSON.parse(d) : d))(
    e.args,
  );
  return {
    ...e,
    ...(mappedArgs && { args: mappedArgs }),
  };
};

/**
 * Serializes a trace event to a JSON string for storage.
 * First encodes the event structure (converting object details to JSON strings),
 * then stringifies the entire event.
 * @param event - Trace event to serialize
 * @returns JSON string representation of the encoded trace event
 */
export const serializeTraceEvent = (event: TraceEvent): string =>
  JSON.stringify(encodeEvent(event));

/**
 * Deserializes a JSON string back to a trace event.
 * First parses the JSON string, then decodes the event structure
 * (parsing JSON string details back to objects).
 * @param json - JSON string representation of a trace event
 * @returns Decoded trace event
 */
export const deserializeTraceEvent = (json: string): TraceEvent =>
  decodeEvent(JSON.parse(json));

/**
 * Creates trace metadata object with standard DevTools fields and custom metadata.
 * @param startDate - Optional start date for the trace, defaults to current date
 * @param metadata - Optional additional metadata to merge into the trace metadata
 * @returns TraceMetadata object with source, startTime, and merged custom metadata
 */
export function getTraceMetadata(
  startDate?: Date,
  metadata?: Record<string, unknown>,
): TraceMetadata {
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
export const createTraceFile = (opt: {
  traceEvents: TraceEvent[];
  startTime?: string;
  metadata?: Partial<TraceMetadata>;
}): TraceEventContainer => ({
  traceEvents: opt.traceEvents.map(encodeEvent),
  displayTimeUnit: 'ms',
  metadata: getTraceMetadata(
    opt.startTime ? new Date(opt.startTime) : new Date(),
    opt.metadata,
  ),
});
