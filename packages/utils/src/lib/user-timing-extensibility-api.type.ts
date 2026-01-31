import type { MarkOptions, MeasureOptions } from 'node:perf_hooks';

/**
 * Color options for feedback states in DevTools.
 * Used for error and warning states on marker and track entries.
 * @example
 * - 'error' - red
 * - 'warning' - yellow
 */
export type DevToolsFeedbackColor = 'error' | 'warning';

/**
 * Color options for action states in DevTools.
 * Used for valid states on marker and track entries.
 * @example
 * - 'primary' - blue (default)
 * - 'primary-dark' - dark blue
 * - 'primary-light' - light blue
 * - 'secondary' - purple
 * - 'secondary-dark' - dark purple
 * - 'secondary-light' - light purple
 * - 'tertiary' - green
 * - 'tertiary-dark' - dark green
 * - 'tertiary-light' - light green
 */
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

/**
 * Union type of all available DevTools color options.
 */
export type DevToolsColor = DevToolsFeedbackColor | DevToolsActionColor;

/**
 * Array of key-value pairs for detailed DevTools properties.
 */
export type DevToolsProperties = [
  key: string,
  value: string | number | boolean | object | undefined,
][];

/**
 * EntryMeta is used to store metadata about a track entry.
 * @property {string} [tooltipText] - Short description for tooltip on hover
 * @property {DevToolsProperties} [properties] - Key-value pairs for detailed view on click.
 * It provides better styling of values including features like automatic links rendering.
 */
export type EntryMeta = {
  tooltipText?: string;
  properties?: DevToolsProperties;
};

/**
 * Styling options for track entries and marker in DevTools.
 * @property {DevToolsColor} [color] - rendered color of background and border, defaults to "primary"
 */
export type TrackStyle = {
  color?: DevToolsColor;
};

/**
 * Metadata for organizing track entries in DevTools.
 * @property {string} track - Name of the custom track
 * @property {string} [trackGroup] - Group for organizing tracks.
 */
export type TrackMeta = {
  track: string;
  trackGroup?: string;
};

/**
 * Base type combining entry metadata and styling for DevTools tracks.
 */
export type TrackBase = EntryMeta & TrackStyle;

/**
 * Payload for track entries in DevTools Performance panel.
 * @property {'track-entry'} [dataType] - Defaults to "track-entry"
 *
 * This type is visible in a custom track with name defined in `track` property.
 */
export type TrackEntryPayload = {
  dataType?: 'track-entry';
} & TrackBase &
  TrackMeta;

/**
 * Payload for marker entries in DevTools Performance panel.
 * @property {'marker'} dataType - Identifies as a marker
 * This type is visible as a marker on top of all tracks and in addition creates a vertical line spanning all lanes in the performance palen.
 */
export type MarkerPayload = {
  dataType: 'marker';
} & TrackBase;

/**
 * Utility type that forces a color property to be 'error'.
 */
export type WithErrorColor<T extends { color?: DevToolsColor }> = Omit<
  T,
  'color'
> & {
  color: 'error';
};

/**
 * Action color payload.
 * @param color - The color of the action
 * @returns The action color payload
 */
export type ActionColorPayload = {
  color?: DevToolsActionColor;
};

/**
 * Action track payload.
 * @param TrackEntryPayload - The track entry payload
 * @param ActionColorPayload - The action color payload
 * @returns The action track payload
 */
export type ActionTrackEntryPayload = TrackEntryPayload & ActionColorPayload;

/**
 * Utility type that adds an optional devtools payload property.
 */
export type WithDevToolsPayload<T extends TrackEntryPayload | MarkerPayload> = {
  devtools?: T;
};

/**
 * Extended MarkOptions that supports DevTools payload in detail.
 * @example
 * const options: MarkOptionsWithDevtools = {
 *    detail: {
 *      devtools: {
 *        dataType: 'marker',
 *        color: 'error',
 *      },
 *   },
 * }
 * profiler.mark('start-program', options);
 */
export type MarkOptionsWithDevtools<
  T extends TrackEntryPayload | MarkerPayload,
> = {
  detail?: WithDevToolsPayload<T>;
} & Omit<MarkOptions, 'detail'>;

/**
 * Extended MeasureOptions that supports DevTools payload in detail.
 * @example
 * const options: MeasureOptionsWithDevtools = {
 *   detail: {
 *     devtools: {
 *       dataType: 'track-entry',
 *       color: 'primary',
 *       }
 *     }
 *   }
 *   profiler.measure('load-program', 'start-program', 'end-program', options);
 */
export type MeasureOptionsWithDevtools<T extends TrackEntryPayload> = {
  detail?: WithDevToolsPayload<T>;
} & Omit<MeasureOptions, 'detail'>;

/**
 * Detail object containing DevTools payload for user timing events.
 * Extends WithDevToolsPayload to include track entry or marker payload.
 * This can be used in trace event arguments to provide additional context in DevTools.
 */
export type UserTimingDetail = WithDevToolsPayload<
  TrackEntryPayload | MarkerPayload
>;
