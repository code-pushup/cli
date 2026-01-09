import type {
  DevToolsColor,
  DevToolsProperties,
  EntryMeta,
  MarkOptionsWithDevtools,
  MarkerPayload,
  MeasureOptionsWithDevtools,
  TrackEntryPayload,
  WithDevToolsPayload,
} from './user-timing-extensibility-api.type.js';

const dataTypeTrackEntry = 'track-entry';
const dataTypeMarker = 'marker';

export function mergePropertiesWithOverwrite(
  baseProperties: DevToolsProperties | undefined,
  overrideProperties?: DevToolsProperties | undefined,
) {
  return [
    ...new Map([...(baseProperties ?? []), ...(overrideProperties ?? [])]),
  ] satisfies DevToolsProperties;
}

export function markerPayload(options?: Omit<MarkerPayload, 'dataType'>) {
  return {
    dataType: dataTypeMarker,
    ...options,
  } satisfies MarkerPayload;
}

export function trackEntryPayload(
  options: Omit<TrackEntryPayload, 'dataType'>,
) {
  const { track, ...rest } = options;
  return {
    dataType: dataTypeTrackEntry,
    track,
    ...rest,
  } satisfies TrackEntryPayload;
}

export function markerErrorPayload<T extends DevToolsColor>(
  options?: Omit<MarkerPayload, 'dataType' | 'color'>,
) {
  return {
    dataType: dataTypeMarker,
    color: 'error' as T,
    ...options,
  } satisfies MarkerPayload;
}

export function trackEntryErrorPayload<
  T extends string,
  C extends DevToolsColor,
>(
  options: Omit<TrackEntryPayload, 'color' | 'dataType'> & {
    track: T;
    color?: C;
  },
) {
  const { track, color = 'error' as const, ...restOptions } = options;
  return {
    dataType: dataTypeTrackEntry,
    color,
    track,
    ...restOptions,
  } satisfies TrackEntryPayload;
}

export function errorToDevToolsProperties(e: unknown) {
  const name = e instanceof Error ? e.name : 'UnknownError';
  const message = e instanceof Error ? e.message : String(e);
  return [
    ['Error Type' as const, name],
    ['Error Message' as const, message],
  ] satisfies DevToolsProperties;
}

export function errorToEntryMeta(
  e: unknown,
  options?: {
    tooltipText?: string;
    properties?: DevToolsProperties;
  },
) {
  const { properties, tooltipText } = options ?? {};
  const props = mergePropertiesWithOverwrite(
    errorToDevToolsProperties(e),
    properties,
  );
  return {
    properties: props,
    ...(tooltipText ? { tooltipText } : {}),
  } satisfies EntryMeta;
}

export function errorToTrackEntryPayload<T extends string>(
  error: unknown,
  detail: Omit<TrackEntryPayload, 'color' | 'dataType'> & {
    track: T;
  },
) {
  const { properties, tooltipText, ...trackPayload } = detail;
  return {
    dataType: dataTypeTrackEntry,
    color: 'error' as const,
    ...trackPayload,
    ...errorToEntryMeta(error, {
      properties,
      tooltipText,
    }),
  } satisfies TrackEntryPayload;
}

export function errorToMarkerPayload(
  error: unknown,
  detail?: Omit<MarkerPayload, 'color' | 'dataType'>,
) {
  const { properties, tooltipText } = detail ?? {};
  return {
    dataType: dataTypeMarker,
    color: 'error' as const,
    ...errorToEntryMeta(error, {
      properties,
      tooltipText,
    }),
  } satisfies MarkerPayload;
}

/**
 * asOptions wraps a DevTools payload into the `detail` property of User Timing entry options.
 *
 * @example
 * profiler.mark('mark', asOptions({
 *   dataType: 'marker',
 *   color: 'error',
 *   tooltipText: 'This is a marker',
 *   properties: [
 *     ['str', 'This is a detail property']
 *   ],
 * }));
 */
export function asOptions<T extends MarkerPayload>(
  devtools?: T | null,
): MarkOptionsWithDevtools<T>;
export function asOptions<T extends TrackEntryPayload>(
  devtools?: T | null,
): MeasureOptionsWithDevtools<T>;
export function asOptions<T extends MarkerPayload | TrackEntryPayload>(
  devtools?: T | null,
): {
  detail?: WithDevToolsPayload<T>;
} {
  return devtools != null ? { detail: { devtools } } : { detail: {} };
}
