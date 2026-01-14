import type { UserTimingDetail } from './user-timing-extensibility-api.type.js';

/**
 * Arguments for instant trace events.
 * @property {UserTimingDetail} [detail] - Optional user timing detail with DevTools payload
 */
export type InstantEventArgs = {
  detail?: UserTimingDetail;
} & { [key: string]: unknown };

/**
 * Arguments for span trace events (begin/end events).
 * @property {object} [data] - Optional data object
 * @property {UserTimingDetail} [data.detail] - Optional user timing detail with DevTools payload
 */
export type SpanEventArgs = {
  data?: { detail?: UserTimingDetail };
} & { [key: string]: unknown };

/**
 * Arguments for complete trace events.
 * @property {Record<string, unknown>} [detail] - Optional detail object with arbitrary properties
 */
export type CompleteEventArgs = { detail?: Record<string, unknown> };

/**
 * Arguments for start tracing events.
 * @property {object} data - Tracing initialization data
 * @property {number} data.frameTreeNodeId - Frame tree node identifier
 * @property {Array} data.frames - Array of frame information
 * @property {boolean} data.persistentIds - Whether IDs are persistent
 */
export type InstantEventTracingStartedInBrowserArgs = {
  data: {
    frameTreeNodeId: number;
    frames: {
      frame: string;
      isInPrimaryMainFrame: boolean;
      isOutermostMainFrame: boolean;
      name: string;
      processId: number;
      url: string;
    }[];
    persistentIds: boolean;
  };
};

/**
 * Union type of all possible trace event arguments.
 */
export type TraceArgs =
  | InstantEventArgs
  | SpanEventArgs
  | CompleteEventArgs
  | InstantEventTracingStartedInBrowserArgs;

/**
 * Base properties shared by all trace events.
 * @property {string} cat - Event category
 * @property {string} name - Event name
 * @property {number} pid - Process ID
 * @property {number} tid - Thread ID
 * @property {number} ts - Timestamp in epoch microseconds
 * @property {TraceArgs} [args] - Optional event arguments
 */
export type BaseTraceEvent = {
  cat: string;
  name: string;
  pid: number;
  tid: number;
  ts: number;
  args: TraceArgs;
};

/**
 * Start tracing event for Chrome DevTools tracing.
 */
export type InstantEventTracingStartedInBrowser = BaseTraceEvent & {
  cat: 'devtools.timeline';
  ph: 'i';
  name: 'TracingStartedInBrowser';
  args: InstantEventTracingStartedInBrowserArgs;
};

/**
 * Complete trace event with duration.
 * Represents a complete operation with start time and duration.
 * @property {'X'} ph - Phase indicator for complete events
 * @property {number} dur - Duration in microseconds
 */
export type CompleteEvent = BaseTraceEvent & { ph: 'X'; dur: number };

/**
 * Instant trace event representing a single point in time.
 * Used for user timing marks and other instantaneous events.
 * @property {'blink.user_timing'} cat - Fixed category for user timing events
 * @property {'i'} ph - Phase indicator for instant events
 * @property {never} [dur] - Duration is not applicable for instant events
 * @property {InstantEventArgs} [args] - Optional event arguments
 */
export type InstantEvent = Omit<BaseTraceEvent, 'cat' | 'args'> & {
  cat: 'blink.user_timing';
  ph: 'i';
  dur?: never;
  args: InstantEventArgs;
};

/**
 * Core properties for span trace events (begin/end pairs).
 * @property {object} id2 - Span identifier
 * @property {string} id2.local - Local span ID (unique to the process, same for b and e events)
 * @property {SpanEventArgs} [args] - Optional event arguments
 */
type SpanCore = Omit<BaseTraceEvent, 'args'> & {
  id2: { local: string };
  args: SpanEventArgs;
};
/**
 * Begin event for a span (paired with an end event).
 * @property {'b'} ph - Phase indicator for begin events
 * @property {never} [dur] - Duration is not applicable for begin events
 */
export type BeginEvent = SpanCore & {
  ph: 'b';
  dur?: never;
};

/**
 * End event for a span (paired with a begin event).
 * @property {'e'} ph - Phase indicator for end events
 * @property {never} [dur] - Duration is not applicable for end events
 */
export type EndEvent = SpanCore & { ph: 'e'; dur?: never };

/**
 * Union type for span events (begin or end).
 */
export type SpanEvent = BeginEvent | EndEvent;

/**
 * Union type of all trace event types.
 */
export type TraceEvent =
  | InstantEvent
  | CompleteEvent
  | SpanEvent
  | InstantEventTracingStartedInBrowser;

/**
 * Raw arguments format for trace events before processing.
 * Either contains a detail string directly or nested in a data object.
 */
type RawArgs =
  | { detail?: string; [key: string]: unknown }
  | { data?: { detail?: string }; [key: string]: unknown };

/**
 * Raw trace event format before type conversion.
 * Similar to TraceEvent but with unprocessed arguments.
 */
export type TraceEventRaw = Omit<TraceEvent, 'args'> & { args: RawArgs };

/**
 * Time window bounds (min, max) in trace time units (e.g. microseconds).
 * @property {number} min - Minimum timestamp in the window
 * @property {number} max - Maximum timestamp in the window
 * @property {number} range - Calculated range (max - min)
 */
export type BreadcrumbWindow = {
  min: number;
  max: number;
  range: number;
};

/**
 * Custom label for a specific trace entry.
 * @property {number | string} entryId - ID or index of the trace entry
 * @property {string} label - Label text for the entry
 * @property {string} [color] - Optional display color for the label
 */
export type EntryLabel = {
  entryId: number | string;
  label: string;
  color?: string;
};

/**
 * Link or relation between two trace entries.
 * @property {number | string} fromEntryId - Source entry ID for the link
 * @property {number | string} toEntryId - Target entry ID for the link
 * @property {string} [linkType] - Optional type or description of the link
 */
export type EntryLink = {
  fromEntryId: number | string;
  toEntryId: number | string;
  linkType?: string;
};

/**
 * A time range annotated with a label.
 * @property {number} startTime - Start timestamp of the range (microseconds)
 * @property {number} endTime - End timestamp of the range (microseconds)
 * @property {string} label - Annotation label for the time range
 * @property {string} [color] - Optional display color for the range
 */
export type LabelledTimeRange = {
  startTime: number;
  endTime: number;
  label: string;
  color?: string;
};

/**
 * Hidden or expandable entries information.
 * @property {unknown[]} hiddenEntries - IDs or indexes of hidden entries
 * @property {unknown[]} expandableEntries - IDs or indexes of expandable entries
 */
export type EntriesModifications = {
  hiddenEntries: unknown[];
  expandableEntries: unknown[];
};

/**
 * Initial breadcrumb information for time ranges and window.
 * @property {BreadcrumbWindow} window - Time window bounds
 * @property {unknown | null} child - Child breadcrumb or null
 */
export type InitialBreadcrumb = {
  window: BreadcrumbWindow;
  child: unknown | null;
};

/**
 * Annotations such as labels and links between entries.
 * @property {EntryLabel[]} entryLabels - Custom labels for entries
 * @property {LabelledTimeRange[]} labelledTimeRanges - Time ranges annotated with labels
 * @property {EntryLink[]} linksBetweenEntries - Links or relations between entries
 */
export type Annotations = {
  entryLabels: EntryLabel[];
  labelledTimeRanges: LabelledTimeRange[];
  linksBetweenEntries: EntryLink[];
};

/**
 * Modifications made to trace data or UI in DevTools export
 */
export type Modifications = {
  entriesModifications: EntriesModifications;
  initialBreadcrumb: InitialBreadcrumb;
  annotations: Annotations;
};

/**
 * Top-level metadata for a trace file exported by Chrome DevTools.
 * DevTools may add new fields over time.
 */
export type TraceMetadata = {
  /** Usually "DevTools" for exports from the Performance panel */
  source: string;

  /** ISO timestamp when trace was recorded */
  startTime: string;

  /** May be present when recorded with throttling settings */
  hardwareConcurrency?: number;

  /** Common fields found in DevTools traces */
  cpuThrottling?: number;
  networkThrottling?: string;
  enhancedTraceVersion?: number;

  /** Allow additional custom metadata properties */
  [key: string]: unknown;
};

/**
 * Structured container for trace events with metadata.
 * @property {TraceEvent[]} traceEvents - Array of trace events
 * @property {'ms' | 'ns'} [displayTimeUnit] - Time unit for display (milliseconds or nanoseconds)
 * @property {TraceMetadata} [metadata] - Optional metadata about the trace
 */
export type TraceEventContainer = {
  traceEvents: TraceEvent[];
  displayTimeUnit?: 'ms' | 'ns';
  metadata?: TraceMetadata;
};

/**
 * Trace file format - either an array of events or a structured container.
 */
export type TraceFile = TraceEvent[] | TraceEventContainer;
