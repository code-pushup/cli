import {
  type DevToolsColor,
  type DevToolsProperties,
  type EntryMeta,
  type MarkOptionsWithDevtools,
  type MarkerPayload,
  type MeasureOptionsWithDevtools,
  type TrackEntryPayload,
} from './user-timing-details.type.js';

export function objToPropertiesPayload(
  object: Record<string, string | number | boolean | object | undefined>,
): DevToolsProperties {
  return Object.entries(object);
}

export function mergePropertiesWithOverwrite(
  baseProperties: DevToolsProperties | undefined,
  overrideProperties?: DevToolsProperties | undefined,
): DevToolsProperties {
  return objToPropertiesPayload({
    ...Object.fromEntries(
      (baseProperties ?? []).map(([key, value]) => [key, String(value)]),
    ),
    ...Object.fromEntries(
      (overrideProperties ?? []).map(([key, value]) => [key, String(value)]),
    ),
  });
}

export function markerPayload(
  options?: Omit<MarkerPayload, 'dataType'>,
): MarkerPayload {
  return {
    dataType: 'marker',
    ...options,
  };
}

export function trackEntryPayload(
  options: Omit<TrackEntryPayload, 'dataType'>,
): TrackEntryPayload {
  const { track = 'Main', ...rest } = options;
  return {
    dataType: 'track-entry',
    track,
    ...rest,
  };
}

export function markerErrorPayload<T extends DevToolsColor>(
  options?: Omit<MarkerPayload, 'dataType' | 'color'>,
  errorColor: T = 'error' as T,
): MarkerPayload {
  return {
    dataType: 'marker',
    color: errorColor,
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
): TrackEntryPayload {
  const { track, color = 'error', ...restOptions } = options;
  return {
    dataType: 'track-entry',
    color: color,
    track,
    ...restOptions,
  } satisfies TrackEntryPayload;
}

export function errorToDevToolsProperties(e: unknown): DevToolsProperties {
  const name = e instanceof Error ? e.name : 'UnknownError';
  const message = e instanceof Error ? e.message : String(e);
  return [
    ['Error Type', name],
    ['Error Message', message],
  ];
}

export function errorToEntryMeta(
  e: unknown,
  options?: {
    tooltipText?: string;
    properties?: DevToolsProperties;
  },
): EntryMeta {
  const { properties, tooltipText } = options ?? {};
  const props = mergePropertiesWithOverwrite(
    errorToDevToolsProperties(e),
    properties,
  );
  return {
    ...(props.length > 0 ? { properties: props } : {}),
    ...(tooltipText ? { tooltipText } : {}),
  };
}

export function errorToTrackEntryPayload<T extends string>(
  error: unknown,
  detail: Omit<TrackEntryPayload, 'color' | 'dataType'> & {
    track: T;
  },
) {
  const { properties, tooltipText, ...trackPayload } = detail ?? {};
  return {
    dataType: 'track-entry',
    color: 'error' as const,
    ...trackPayload,
    ...errorToEntryMeta(error, {
      properties,
      tooltipText,
    }),
  } satisfies TrackEntryPayload;
}

export function errorToMarkerPayload<T extends DevToolsColor>(
  error: unknown,
  detail?: Omit<MarkerPayload, 'color' | 'dataType'> & { color?: T },
): MarkerPayload {
  const {
    properties,
    tooltipText,
    color = 'error',
    ...markerDetail
  } = detail ?? {};
  return {
    dataType: 'marker',
    color: color,
    ...markerDetail,
    ...errorToEntryMeta(error, {
      properties,
      tooltipText,
    }),
  } satisfies MarkerPayload;
}

/**
 *
 * @example
 * profiler.mark('mark', asOptions(markerPayload({
 *   properties: [
 *     ['str', 'This is a detail property'],
 *     ['num', 42],
 *     ['object', { str: '42', num: 42 }],
 *     ['array', [42, 42, 42]],
 *   ],
 * })));
 */
export function asOptions(
  devtools: MarkerPayload,
): Pick<MarkOptionsWithDevtools, 'detail'>;
export function asOptions(
  devtools: TrackEntryPayload,
): Pick<MeasureOptionsWithDevtools, 'detail'>;
export function asOptions(
  devtools: MarkerPayload | TrackEntryPayload,
):
  | Pick<MarkOptionsWithDevtools, 'detail'>
  | Pick<MeasureOptionsWithDevtools, 'detail'> {
  // keep empty detail to align with performance.measureOptions where detail is required
  return devtools ? { detail: { devtools } } : { detail: {} };
}
