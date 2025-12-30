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

export type DevToolsProperties = Array<[key: string, value: string]>;

export interface DevToolsBase {
  color?: DevToolsColorToken;
  tooltipText?: string;
  properties?: DevToolsProperties;
}

export interface DevToolsTrackEntry extends DevToolsBase {
  // DevTools treats missing dataType as track-entry as long as track is set
  dataType?: 'track-entry';
  // Required: Name of the custom track
  track: string;
  // Optional: Group for organizing tracks
  trackGroup?: string;
}

export interface DevToolsMarker extends DevToolsBase {
  dataType: 'marker';
}

/**
 * Special marker to visualize a mark as error lable in DevTools UI
 * This is visualized at the top of the Timing track (withing the heading space)
 * It also draws a vertical line across all tracks.
 * Both the label and the vertical line are colored red
 */
export interface DevToolsErrorLabel extends DevToolsMarker {
  // To render a mark as label, the track must be missing
  track: never;
  // colors label and vertical line in red
  color: 'error';
}

export type DevToolsPayload =
  | DevToolsTrackEntry
  | DevToolsMarker
  | DevToolsErrorLabel;

// This is the bit you stick into mark/measure detail on the custom tracks and labels:
export interface UserTimingDetail {
  devtools?: DevToolsPayload;
  // ...custom extra detail fields
  // @TODO document text styling in DevTools details view
  [k: string]: unknown;
}
