import { performance } from 'node:perf_hooks';
import { objectFromEntries, objectToEntries } from './transform.js';
import type {
  ActionTrackEntryPayload,
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

/**
 * Merges DevTools properties with override priority.
 * @param baseProperties - Base properties array
 * @param overrideProperties - Override properties array
 * @returns Merged properties array
 */
export function mergePropertiesWithOverwrite<
  const T extends DevToolsProperties,
  const U extends DevToolsProperties,
>(baseProperties: T, overrideProperties: U): (T[number] | U[number])[];
export function mergePropertiesWithOverwrite<
  const T extends DevToolsProperties,
>(baseProperties: T): T;
export function mergePropertiesWithOverwrite(
  baseProperties: DevToolsProperties,
  overrideProperties?: DevToolsProperties,
): DevToolsProperties {
  return [...new Map([...baseProperties, ...(overrideProperties ?? [])])];
}

/**
 * Creates a marker payload with default data type.
 * @param options - Marker options excluding dataType
 * @returns Complete marker payload
 * @example
 * const payload = markerPayload({
 *   color: 'primary',
 *   tooltipText: 'User action completed',
 *   properties: [['action', 'save'], ['duration', 150]]
 * });
 * // { dataType: 'marker', color: 'primary', tooltipText: 'User action completed', ... }
 */
export function markerPayload(options?: Omit<MarkerPayload, 'dataType'>) {
  return {
    dataType: dataTypeMarker,
    ...options,
  } satisfies MarkerPayload;
}

/**
 * Creates a track entry payload with default data type.
 * @param options - Track entry options excluding dataType
 * @returns Complete track entry payload
 * @example
 * const payload = trackEntryPayload({
 *   track: 'user-interactions',
 *   trackGroup: 'frontend',
 *   color: 'secondary',
 *   tooltipText: 'Button click processed',
 *   properties: [['element', 'save-button'], ['response-time', 200]]
 * });
 * // { dataType: 'track-entry', track: 'user-interactions', ... }
 */
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

/**
 * Creates an error marker payload with red color.
 * @param options - Marker options excluding dataType and color
 * @returns Error marker payload
 */
export function markerErrorPayload<T extends DevToolsColor>(
  options?: Omit<MarkerPayload, 'dataType' | 'color'>,
) {
  return {
    dataType: dataTypeMarker,
    color: 'error' as T,
    ...options,
  } satisfies MarkerPayload;
}

/**
 * Creates an error track entry payload with red color.
 * @param options - Track entry options excluding color and dataType
 * @returns Error track entry payload
 */
export function trackEntryErrorPayload<T extends string>(
  options: Omit<TrackEntryPayload, 'color' | 'dataType'> & {
    track: T;
  },
) {
  const { track, ...restOptions } = options;
  return {
    dataType: dataTypeTrackEntry,
    color: 'error' as const,
    track,
    ...restOptions,
  } satisfies TrackEntryPayload;
}

/**
 * Converts an error to DevTools properties array.
 * @param e - Error object or value
 * @returns Array of error properties for DevTools
 */
export function errorToDevToolsProperties(e: unknown) {
  const name = e instanceof Error ? e.name : 'UnknownError';
  const message = e instanceof Error ? e.message : String(e);
  return [
    ['Error Type' as const, name],
    ['Error Message' as const, message],
  ] satisfies DevToolsProperties;
}

/**
 * Converts an error to entry metadata for DevTools.
 * @param e - Error object or value
 * @param options - Additional metadata options
 * @returns Entry metadata with error properties
 */
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
    properties ?? [],
  );
  return {
    properties: props,
    ...(tooltipText ? { tooltipText } : {}),
  } satisfies EntryMeta;
}

/**
 * Converts an error to a track entry payload with error styling.
 * @param error - Error object or value
 * @param detail - Track entry details excluding color and dataType
 * @returns Error track entry payload
 */
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

/**
 * Converts an error to a marker payload with error styling.
 * @param error - Error object or value
 * @param detail - Marker details excluding color and dataType
 * @returns Error marker payload
 */
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
 * Converts DevTools payload to performance API options format.
 * @param devtools - DevTools payload or null
 * @returns Performance API options with DevTools detail
 * @example
 * const marker = markerPayload({ color: 'primary', tooltipText: 'Start' });
 * performance.mark('start', asOptions(marker));
 *
 * const trackEntry = trackEntryPayload({ track: 'operations', color: 'tertiary' });
 * performance.measure('operation', {
 *   start: 'start',
 *   end: 'end',
 *   ...asOptions(trackEntry)
 * });
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
  if (devtools == null) {
    return { detail: {} };
  }

  return { detail: { devtools } };
}

/**
 * Generates start, end, and measure names for performance tracking.
 * @param base - Base name for the measurement
 * @returns Object with startName, endName, and measureName
 */
export type Names<N extends string> = {
  startName: `${N}:start`;
  endName: `${N}:end`;
  measureName: N;
};

/**
 * Generates start, end, and measure names for performance tracking.
 * @param base - Base name for the measurement
 * @param prefix - Optional prefix for names
 * @returns Object with startName, endName, and measureName
 */
export function getNames<T extends string>(base: T): Names<T>;
export function getNames<T extends string, P extends string>(
  base: T,
  prefix?: P,
): Names<`${P}:${T}`>;
export function getNames(base: string, prefix?: string) {
  const n = prefix ? `${prefix}:${base}` : base;
  return {
    startName: `${n}:start`,
    endName: `${n}:end`,
    measureName: n,
  } as const;
}

/**
 * Removes undefined from a type, effectively filtering out undefined values.
 */
type Defined<T> = T extends undefined ? never : T;

/**
 * Merges two objects with the specified overwrite semantics:
 * - If B[K] is undefined → keep A[K]
 * - If B[K] is defined → overwrite with Defined<B[K]>
 * - Keys only in A → keep A[K]
 * - Keys only in B → take Defined<B[K]>
 */
type MergeDefined<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? Defined<B[K]> extends never
      ? K extends keyof A
        ? A[K]
        : never
      : Defined<B[K]>
    : K extends keyof A
      ? A[K]
      : never;
};

/**
 * Recursively merges an array of objects using MergeDefined semantics.
 * The first element is the base type, subsequent elements only overwrite with defined values.
 */
type MergeResult<P extends readonly unknown[]> = P extends readonly [
  infer A,
  ...infer R,
]
  ? MergeDefined<A & {}, MergeResult<R>>
  : object;

/**
 * Merges multiple DevTools payloads into a single payload.
 * The first payload establishes the base type, subsequent payloads only overwrite with defined values.
 * @param parts - Array of payloads where first is complete and rest are partial
 * @returns Merged payload with combined properties
 * @example
 * const payload = mergeDevtoolsPayload(
 *   trackEntryPayload({ track: 'user-interactions', color: 'secondary' }),
 *   { color: 'primary', tooltipText: 'User action completed' },
 * );
 * // { track: 'user-interactions', color: 'primary', tooltipText: 'User action completed' }
 */
export function mergeDevtoolsPayload<
  const P extends readonly [
    TrackEntryPayload | MarkerPayload,
    ...Partial<TrackEntryPayload | MarkerPayload>[],
  ],
>(...parts: P): MergeResult<P> & { properties?: DevToolsProperties } {
  return parts.reduce(
    (acc, cur) => ({
      ...acc,
      ...cur,
      ...(cur.properties || acc.properties
        ? {
            properties: mergePropertiesWithOverwrite(
              acc.properties ?? [],
              cur.properties ?? [],
            ),
          }
        : {}),
    }),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as MergeResult<P> & { properties?: DevToolsProperties },
  );
}

/**
 * Sets up tracks with default values merged into each track.
 * This helps to avoid repetition when defining multiple tracks with common properties.
 * @param defaults - Default action track configuration
 * @param tracks - Track configurations to merge with defaults
 * @returns Record with merged track configurations
 */
export function setupTracks<
  const T extends Record<string, Partial<ActionTrackEntryPayload>>,
  const D extends ActionTrackEntryPayload,
>(defaults: D, tracks: T) {
  return objectFromEntries(
    objectToEntries(tracks).map(([key, track]) => [
      key,
      mergeDevtoolsPayload(defaults, track),
    ]),
  );
}

/**
 * This is a helper function used to ensure that the marks used to create a measure do not contain UI interaction properties.
 * @param devtools - The devtools payload to convert to mark options.
 * @returns The mark options without dataType, tooltipText and properties.
 */
function toMarkMeasureOpts<T extends TrackEntryPayload>(devtools: T) {
  const {
    dataType: _,
    tooltipText: __,
    properties: ___,
    ...markDevtools
  } = devtools;
  return { detail: { devtools: markDevtools } };
}

/**
 * Options for customizing measurement behavior and callbacks.
 * Extends partial ActionTrackEntryPayload to allow overriding default track properties.
 */
export type MeasureOptions = Partial<ActionTrackEntryPayload> & {
  /**
   * Callback invoked when measurement completes successfully.
   * @param result - The successful result value
   * @returns Additional DevTools properties to merge for success state
   */
  success?: (result: unknown) => Partial<ActionTrackEntryPayload>;
  /**
   * Callback invoked when measurement fails with an error.
   * @param error - The error that occurred
   * @returns Additional DevTools properties to merge for error state
   */
  error?: (error: unknown) => Partial<ActionTrackEntryPayload>;
};

/**
 * Configuration for creating a measurement context.
 * Defines default behavior and appearance for all measurements in this context.
 */
export type MeasureCtxOptions = ActionTrackEntryPayload & {
  /**
   * Optional prefix for all measurement names to avoid conflicts.
   * @example "api:" results in names like "api:request:start"
   */
  prefix?: string;
} & {
  /**
   * Global error handler for all measurements in this context.
   * Applied to all error states in addition to per-measurement error callbacks.
   * @param error - The error that occurred
   * @returns Additional DevTools metadata for error display
   */
  error?: (error: unknown) => EntryMeta;
};
/**
 * Creates a measurement context for tracking performance events with consistent DevTools visualization.
 *
 * This function returns a higher-order function that generates measurement controllers for individual events.
 * Each measurement creates start/end marks and a final measure in Chrome DevTools Performance panel.
 *
 * @param cfg - Configuration defining default track properties, optional prefix, and global error handling
 * @returns Function that creates measurement controllers for specific events
 * @example
 * // Basic usage with defaults
 * const measure = measureCtx({
 *   track: 'api-calls',
 *   color: 'secondary',
 *   trackGroup: 'backend'
 * });
 *
 * const { start, success, error } = measure('fetch-user');
 * start(); // Creates "fetch-user:start" mark
 * // ... async operation ...
 * success({ userCount: 42 }); // Creates "fetch-user:end" mark and "fetch-user" measure
 * @example
 * // Advanced usage with callbacks and error handling
 * const measure = measureCtx({
 *   track: 'user-actions',
 *   color: 'primary',
 *   error: (err) => ({
 *     properties: [['error-type', err.name], ['error-message', err.message]]
 *   })
 * });
 *
 * const { start, success, error } = measure('save-form', {
 *   success: (result) => ({
 *     properties: [['items-saved', result.count]],
 *     tooltipText: `Saved ${result.count} items successfully`
 *   }),
 *   error: (err) => ({
 *     properties: [['validation-errors', err.errors?.length ?? 0]]
 *   })
 * });
 *
 * start();
 * try {
 *   const result = await saveFormData(formData);
 *   success(result);
 * } catch (err) {
 *   error(err); // Applies both global and specific error metadata
 * }
 * @example
 * // onetime config of defaults
 * const apiMeasure = measureCtx({
 *   prefix: 'http:',
 *   track: 'api',
 * });
 *
 * const { start, success, error } = apiMeasure('login');
 *
 * start();
 * try {
 *   const result = myWork();
 *   success(result);
 *   return result;
 * } catch(err) {
 *   error(err)
 * }
 * @returns Object with measurement control methods:
 * - `start()`: Marks the beginning of the measurement
 * - `success(result?)`: Completes successful measurement with optional result metadata
 * - `error(error)`: Completes failed measurement with error metadata
 */

export function measureCtx(cfg: MeasureCtxOptions) {
  const { prefix, error: globalErr, ...defaults } = cfg;

  return (event: string, opt?: MeasureOptions) => {
    const { success, error, ...measurePayload } = opt ?? {};
    const merged = mergeDevtoolsPayload(defaults, measurePayload);
    const {
      startName: s,
      endName: e,
      measureName: m,
    } = getNames(event, prefix);

    return {
      start: () => performance.mark(s, toMarkMeasureOpts(merged)),

      success: (r: unknown) => {
        const successPayload = mergeDevtoolsPayload(merged, success?.(r) ?? {});
        performance.mark(e, toMarkMeasureOpts(successPayload));
        performance.measure(m, {
          start: s,
          end: e,
          ...asOptions(successPayload),
        });
      },

      error: (err: unknown) => {
        const errorPayload = mergeDevtoolsPayload(
          { ...merged, color: 'error' },
          errorToEntryMeta(err),
          globalErr?.(err) ?? {},
          error?.(err) ?? {},
        );
        performance.mark(e, toMarkMeasureOpts(errorPayload));
        performance.measure(m, {
          start: s,
          end: e,
          ...asOptions(errorPayload),
        });
      },
    };
  };
}
