import { performance } from 'node:perf_hooks';
import { objectToEntries } from './transform.js';
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

export function mergePropertiesWithOverwrite<
  const T extends DevToolsProperties,
  const U extends DevToolsProperties,
>(baseProperties: T, overrideProperties: U): (T[number] | U[number])[];
export function mergePropertiesWithOverwrite<
  const T extends DevToolsProperties,
>(baseProperties: T): T;
export function mergePropertiesWithOverwrite(
  baseProperties?: DevToolsProperties,
  overrideProperties?: DevToolsProperties,
): DevToolsProperties {
  return [
    ...new Map([...(baseProperties ?? []), ...(overrideProperties ?? [])]),
  ];
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
    properties ?? [],
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

export type Names<N extends string> = {
  startName: `${N}:start`;
  endName: `${N}:end`;
  measureName: N;
};

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

type Simplify<T> = { [K in keyof T]: T[K] } & object;

type MergeObjects<T extends readonly object[]> = T extends readonly [
  infer F extends object,
  ...infer R extends readonly object[],
]
  ? Simplify<Omit<F, keyof MergeObjects<R>> & MergeObjects<R>>
  : object;

export type MergeResult<
  P extends readonly Partial<TrackEntryPayload | MarkerPayload>[],
> = MergeObjects<P> & { properties?: DevToolsProperties };

export function mergeDevtoolsPayload<
  const P extends readonly Partial<TrackEntryPayload | MarkerPayload>[],
>(...parts: P): MergeResult<P> {
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
    {},
  ) as MergeResult<P>;
}

export function mergeDevtoolsPayloadAction<
  const P extends readonly [ActionTrack, ...Partial<ActionTrack>[]],
>(...parts: P): MergeObjects<P> & { properties?: DevToolsProperties } {
  return mergeDevtoolsPayload(
    ...(parts as unknown as readonly Partial<
      TrackEntryPayload | MarkerPayload
    >[]),
  ) as MergeObjects<P> & { properties?: DevToolsProperties };
}

export type ActionColorPayload = {
  color?: DevToolsColor;
};
export type ActionTrack = TrackEntryPayload & ActionColorPayload;

export function setupTracks<
  const T extends Record<string, Partial<ActionTrack>>,
  const D extends ActionTrack,
>(defaults: D, tracks: T) {
  return objectToEntries(tracks).reduce(
    (result, [key, track]) => ({
      ...result,
      [key]: mergeDevtoolsPayload(defaults, track, {
        dataType: dataTypeTrackEntry,
      }),
    }),
    {} as Record<keyof T, ActionTrack>,
  ) as Record<keyof T, ActionTrack>;
}

/**
 * This is a helper function used to ensure that the marks used to create a measure do not contain UI interaction properties.
 * @param devtools - The devtools payload to convert to mark options.
 * @returns The mark options without tooltipText and properties.
 */
function toMarkMeasureOpts(devtools: TrackEntryPayload) {
  const { tooltipText: _, properties: __, ...markDevtools } = devtools;
  return { detail: { devtools: markDevtools } };
}

export type MeasureOptions = Partial<ActionTrack> & {
  success?: (result: unknown) => EntryMeta;
  error?: (error: unknown) => EntryMeta;
};

export type MeasureCtxOptions = ActionTrack & {
  prefix?: string;
} & {
  error?: (error: unknown) => EntryMeta;
};
export function measureCtx(cfg: MeasureCtxOptions) {
  const { prefix, error: globalErr, ...defaults } = cfg;

  return (event: string, opt?: MeasureOptions) => {
    const { success, error, ...measurePayload } = opt ?? {};
    const merged = mergeDevtoolsPayloadAction(defaults, measurePayload, {
      dataType: dataTypeTrackEntry,
    }) as TrackEntryPayload;

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
          errorToEntryMeta(err),
          globalErr?.(err) ?? {},
          error?.(err) ?? {},
          { ...merged, color: 'error' },
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
