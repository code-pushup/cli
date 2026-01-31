import type {
  MarkerPayload,
  TrackEntryPayload,
} from '../user-timing-extensibility-api.type.js';

/** DevTools payload type for trace events. */
export type DevToolsPayload = TrackEntryPayload | MarkerPayload;

/** Unified trace event type for Chrome DevTools trace format. */
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
    data?: { detail?: unknown };
    devtools?: DevToolsPayload;
    [key: string]: unknown;
  };
};

// ─────────────────────────────────────────────────────────────
// DevTools metadata and annotations
// ─────────────────────────────────────────────────────────────

/** Time window bounds in trace time units. */
export type BreadcrumbWindow = {
  min: number;
  max: number;
  range: number;
};

/** Custom label for a trace entry. */
export type EntryLabel = {
  entryId: number | string;
  label: string;
  color?: string;
};

/** Link between two trace entries. */
export type EntryLink = {
  fromEntryId: number | string;
  toEntryId: number | string;
  linkType?: string;
};

/** Time range annotated with a label. */
export type LabelledTimeRange = {
  startTime: number;
  endTime: number;
  label: string;
  color?: string;
};

/** Hidden or expandable entries information. */
export type EntriesModifications = {
  hiddenEntries: unknown[];
  expandableEntries: unknown[];
};

/** Initial breadcrumb information. */
export type InitialBreadcrumb = {
  window: BreadcrumbWindow;
  child: unknown | null;
};

/** Annotations (labels, links, time ranges). */
export type Annotations = {
  entryLabels: EntryLabel[];
  labelledTimeRanges: LabelledTimeRange[];
  linksBetweenEntries: EntryLink[];
};

/** Modifications made to trace data in DevTools export. */
export type Modifications = {
  entriesModifications: EntriesModifications;
  initialBreadcrumb: InitialBreadcrumb;
  annotations: Annotations;
};

/** Top-level metadata for Chrome DevTools trace files. */
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

  /** DevTools may add new fields over time */
  [key: string]: unknown;
};

/** Structured container for trace events with metadata. */
export type TraceEventContainer = {
  traceEvents: TraceEvent[];
  displayTimeUnit?: 'ms' | 'ns';
  metadata?: TraceMetadata;
};

/** Trace file format: array of events or structured container. */
export type TraceFile = TraceEventContainer;

/** Options for creating a tracing started in browser event. */
export type TracingStartedInBrowserOptions = {
  url: string;
  ts?: number;
  pid?: number;
  tid?: number;
};
