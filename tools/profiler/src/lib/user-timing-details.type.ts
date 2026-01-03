import {
  type MarkOptions,
  type MeasureOptions,
  type PerformanceMark,
  type PerformanceMeasure,
} from 'node:perf_hooks';

export type DevToolsColor =
  | 'primary'
  | 'primary-light'
  | 'primary-dark'
  | 'secondary'
  | 'secondary-light'
  | 'secondary-dark'
  | 'tertiary'
  | 'tertiary-light'
  | 'tertiary-dark'
  | 'error'
  | 'warning';

performance.mark('');

export type DevToolsDataType = 'marker' | 'track-entry';

export type DevToolsProperties = Array<
  [key: string, value: string | number | boolean | object | undefined]
>;

export interface EntryMeta {
  tooltipText?: string; // Short description for tooltip on hover
  properties?: DevToolsProperties; // Key-value pairs for detailed view on click
}
export interface TrackStyle {
  color?: DevToolsColor; // rendered color of background and border, defaults to "primary"
}
export interface TrackMeta {
  track: string; // Required: Name of the custom track
  trackGroup?: string; // Optional: Group for organizing tracks
}

export type ExtensionTrackBase = EntryMeta & TrackStyle;

export interface TrackEntryPayload extends ExtensionTrackBase, TrackMeta {
  dataType?: 'track-entry'; // Defaults to "track-entry"
}

export interface MarkerPayload extends ExtensionTrackBase {
  dataType: 'marker'; // Required: Identifies as a marker
}

// Generic type helper that fixes color to 'error' for any type with a color property
export type WithErrorColor<T extends { color?: DevToolsColor }> = Omit<
  T,
  'color'
> & {
  color: 'error';
};
export type WithDevToolsPayload<T extends TrackEntryPayload | MarkerPayload> = {
  devtools?: T;
};
export type DevToolsPayload = TrackEntryPayload | MarkerPayload;
export type UserTimingDetailMeasurePayload =
  WithDevToolsPayload<TrackEntryPayload> & {
    [k: string]: unknown;
  };
export type UserTimingDetailMarkPayload = WithDevToolsPayload<
  TrackEntryPayload | MarkerPayload
> & {
  [k: string]: unknown;
};
export type UserTimingDetail =
  | UserTimingDetailMeasurePayload
  | UserTimingDetailMarkPayload;

// DevTools-enhanced performance API types
export interface MarkOptionsWithDevtools extends Omit<MarkOptions, 'detail'> {
  detail?: WithDevToolsPayload<TrackEntryPayload | MarkerPayload>;
}

export interface MeasureOptionsWithDevtools
  extends Omit<MeasureOptions, 'detail'> {
  detail?: WithDevToolsPayload<TrackEntryPayload>;
}

// Mimics performance.mark/measure API with devtools extensions
export interface NativePerformanceAPI {
  mark(name: string, options?: MarkOptionsWithDevtools): PerformanceMark;

  measure(
    name: string,
    options: MeasureOptionsWithDevtools,
  ): PerformanceMeasure;
  measure(
    name: string,
    startMark?: string,
    endMark?: string,
  ): PerformanceMeasure;
}
