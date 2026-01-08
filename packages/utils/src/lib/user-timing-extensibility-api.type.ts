import type {
  MarkOptions,
  MeasureOptions,
  PerformanceMark,
  PerformanceMeasure,
} from 'node:perf_hooks';

export type DevToolsFeedbackColor = 'error' | 'warning';

export type DevToolsActionColor =
  | 'primary'
  | 'primary-dark'
  | 'primary-light'
  | 'secondary'
  | 'secondary-dark'
  | 'secondary-light'
  | 'tertiary'
  | 'tertiary-dark'
  | 'tertiary-light';

export type DevToolsColor = DevToolsFeedbackColor | DevToolsActionColor;

export type DevToolsDataType = 'marker' | 'track-entry';

export type DevToolsProperties = [
  key: string,
  value: string | number | boolean | object | undefined,
][];

export type EntryMeta = {
  tooltipText?: string; // Short description for tooltip on hover
  properties?: DevToolsProperties; // Key-value pairs for detailed view on click
};

export type TrackStyle = {
  color?: DevToolsColor; // rendered color of background and border, defaults to "primary"
};

export type TrackMeta = {
  track: string; // Name of the custom track
  trackGroup?: string; // Group for organizing tracks
};

export type ExtensionTrackBase = EntryMeta & TrackStyle;

export type TrackEntryPayload = {
  dataType?: 'track-entry'; // Defaults to "track-entry"
} & ExtensionTrackBase &
  TrackMeta;

export type MarkerPayload = {
  dataType: 'marker'; // Identifies as a marker
} & ExtensionTrackBase;

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

export type MarkOptionsWithDevtools = {
  detail?: WithDevToolsPayload<TrackEntryPayload | MarkerPayload>;
} & Omit<MarkOptions, 'detail'>;

export type MeasureOptionsWithDevtools = {
  detail?: WithDevToolsPayload<TrackEntryPayload>;
} & Omit<MeasureOptions, 'detail'>;
