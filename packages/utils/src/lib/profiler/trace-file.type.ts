import type {
  MarkerPayload,
  TrackEntryPayload,
} from '../user-timing-extensibility-api.type.js';

/** DevTools payload type for trace events. */
export type DevToolsPayload = TrackEntryPayload | MarkerPayload;

/**
 * Unified trace event type for Chrome DevTools trace format.
 */
export type TraceEvent = {
  cat: string;
  ph: string;
  name: string;
  pid: number;
  tid: number;
  ts: number;
  dur?: number;
  id2?: { local: string };
  args?: {
    detail?: unknown;
    data?: { detail?: unknown; [key: string]: unknown };
    devtools?: DevToolsPayload;
    [key: string]: unknown;
  };
};

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
export type TraceFile = TraceEventContainer;

/** Options for creating a tracing started in browser event. */
export type TracingStartedInBrowserOptions = {
  url: string;
  ts?: number;
  pid?: number;
  tid?: number;
};
