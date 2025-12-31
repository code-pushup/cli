export type DevToolsColorToken =
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

export type DevToolsDataType = 'marker' | 'track-entry';

export type DevToolsProperties = Array<[key: string, value: string]>;

export interface DevToolsBase {
  dataType?: DevToolsDataType;
  color?: DevToolsColorToken;
  tooltipText?: string;
  properties?: DevToolsProperties;
}

export interface DevToolsTrackBase extends DevToolsBase {
  // Required: Name of the custom track
  track: string;
  // Optional: Group for organizing tracks
  trackGroup?: string;
}

export interface DevToolsLabel extends Omit<DevToolsBase, 'dataType'> {
  dataType: 'marker';
}
export interface DevToolsMark extends Omit<DevToolsTrackBase, 'dataType'> {
  dataType: 'track-entry';
  track: string;
}

export interface DevToolsMarkError extends Omit<DevToolsTrackBase, 'dataType'> {
  dataType: 'track-entry';
  track: string;
  // colors mark in red
  color: 'error';
}

/**
 * Special marker to visualize a mark as error lable in DevTools UI
 * This is visualized at the top of the Timing track (withing the heading space)
 * It also draws a vertical line across all tracks.
 * Both the label and the vertical line are colored red
 */
export interface DevToolsLabelError
  extends Omit<DevToolsLabel & DevToolsBase, 'track' | 'color'> {
  // To render a mark as label, the track must be missing
  track: never;
  // colors label and vertical line in red
  color: 'error';
}

export interface DevToolsTrackEntry extends DevToolsTrackBase {
  // DevTools treats missing dataType as track-entry as long as track is set
  dataType?: 'track-entry';
}

export type DevToolsPayload =
  | DevToolsTrackEntry
  | DevToolsMark
  | DevToolsLabelError;

// This is the bit you stick into mark/measure detail on the custom tracks and labels:
export interface UserTimingDetail {
  devtools?: DevToolsPayload;
  // ...custom extra detail fields
  // @TODO document text styling in DevTools details view
  [k: string]: unknown;
}
