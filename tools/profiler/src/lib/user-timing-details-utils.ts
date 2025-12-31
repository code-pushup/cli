import type {
  DevToolsBase,
  DevToolsColorToken,
  DevToolsLabel,
  DevToolsLabelError,
  DevToolsMark,
  DevToolsMarkError,
  DevToolsProperties,
  DevToolsTrackEntry,
} from './user-timing-details.type';

export function createErrorLabel(
  error: unknown,
  devToolsOptions?: {
    properties?: DevToolsProperties;
    tooltipText?: string;
  },
): DevToolsLabelError {
  return {
    dataType: 'mark',
    color: 'error',
    track: undefined as never,
    properties: mergePropertiesWithOverwrite(
      errorToDevToolsProperties(error),
      Object.fromEntries(devToolsOptions?.properties ?? []),
    ),
    tooltipText: devToolsOptions?.tooltipText,
  };
}

export function errorToDevToolsProperties(e: unknown): DevToolsProperties {
  const name = e instanceof Error ? e.name : 'UnknownError';
  const message = e instanceof Error ? e.message : String(e);
  return [
    ['Error Type', name],
    ['Error Message', message],
  ];
}

export function createLabel(
  options?: Omit<DevToolsLabel, 'dataType'>,
): DevToolsLabel {
  return {
    dataType: 'mark',
    ...options,
  };
}

export function createLabelError(
  options?: Omit<DevToolsLabel, 'dataType' | 'color'>,
): DevToolsLabel {
  return {
    dataType: 'mark',
    color: 'error',
    ...options,
  };
}

export function createLabelWarning(
  options?: Omit<DevToolsLabel, 'dataType' | 'color'>,
): DevToolsLabel {
  return {
    dataType: 'mark',
    color: 'warning',
    ...options,
  };
}

export function createTrackMark(
  options: Omit<DevToolsMark, 'dataType'>,
): DevToolsMark {
  return {
    dataType: 'track-entry',
    ...options,
  };
}

export function createTrackEntry(
  options: Omit<DevToolsTrackEntry, 'dataType'>,
): DevToolsTrackEntry {
  return {
    dataType: 'track-entry',
    ...options,
  };
}

export function createTrackEntryFromError(
  error: unknown,
  detail: Omit<DevToolsTrackEntry, 'color' | 'dataType'>,
): DevToolsTrackEntry {
  return createTrackEntry({
    ...detail,
    color: 'error',
    properties: mergePropertiesWithOverwrite(
      errorToDevToolsProperties(error),
      Object.fromEntries(detail?.properties ?? []),
    ),
  });
}

export function createErrorMark(
  options: Omit<DevToolsMark, 'color' | 'dataType'>,
): DevToolsMarkError {
  return {
    dataType: 'track-entry',
    color: 'error',
    ...options,
  };
}

export function createErrorMarkFromError(
  error: unknown,
  detail: Omit<DevToolsMark, 'color' | 'dataType'>,
): DevToolsMarkError {
  return createErrorMark({
    ...detail,
    ...mergePropertiesWithOverwrite(
      errorToDevToolsProperties(error),
      Object.fromEntries(detail?.properties ?? []),
    ),
  });
}

export function createErrorLabelFromError(
  error: unknown,
  detail?: Omit<DevToolsLabelError, 'color' | 'dataType'>,
): DevToolsLabelError {
  return createErrorLabel({
    ...detail,
    ...mergePropertiesWithOverwrite(
      errorToDevToolsProperties(error),
      Object.fromEntries(detail?.properties ?? []),
    ),
  });
}

export function propertiesFrom(
  object: Record<string, string>,
): DevToolsProperties {
  return Object.entries(object);
}

export function mergePropertiesWithOverwrite(
  baseProperties: DevToolsProperties | undefined,
  overrideProperties: Record<string, string>,
): DevToolsProperties {
  const basePropsObj = Object.fromEntries(baseProperties ?? []);
  return propertiesFrom({
    ...basePropsObj,
    ...overrideProperties,
  }) as DevToolsProperties;
}

export type DevtoolsSpanConfig<
  T extends string = string,
  G extends string = string,
> = {
  track: T | ((...args: any[]) => T);
  group?: G;
  color?: DevToolsColorToken;
  pathPattern?: string | string[];
};

export type DevtoolsSpanConfigFactory<
  Args extends any[] = any[],
  T extends string = string,
  G extends string = string,
> = (...args: Args) => DevtoolsSpanConfig<T, G>;

export type DevtoolsSpansRegistry<T extends string = 'main'> = Record<
  T,
  DevtoolsSpanConfig | DevtoolsSpanConfigFactory
>;

export type DevtoolsTrackEntryDetail<
  Track extends string = string,
  Group extends string = string,
> = {
  devtools: Omit<DevToolsTrackEntry, 'track' | 'trackGroup'> & {
    track: Track;
    trackGroup?: Group;
  };
};

export type DevtoolsSpanHelpers<
  R extends Record<string, DevtoolsSpanConfig | DevtoolsSpanConfigFactory>,
> = {
  [K in keyof R & string]: R[K] extends DevtoolsSpanConfigFactory<
    infer Args,
    infer T,
    infer G
  >
    ? (...args: Args) => (
        opts?: DevToolsBase & {
          group?: G;
        },
      ) => DevtoolsTrackEntryDetail<T, Extract<G, string>>
    : R[K] extends DevtoolsSpanConfig<infer T, infer G>
      ? R[K]['track'] extends (...args: infer Args) => string
        ? (...args: Args) => (
            opts?: DevToolsBase & {
              group?: G;
            },
          ) => DevtoolsTrackEntryDetail<
            ReturnType<R[K]['track']>,
            Extract<G, string>
          >
        : (
            opts?: DevToolsBase & {
              track?: T;
              group?: G;
            },
          ) => DevtoolsTrackEntryDetail<T, Extract<G, string>>
      : never;
};

export function createDevtoolsSpans<
  const R extends Record<
    string,
    DevtoolsSpanConfig | DevtoolsSpanConfigFactory
  >,
>(registry: R): DevtoolsSpanHelpers<R> {
  type K = keyof R & string;

  return (Object.keys(registry) as K[]).reduce((acc, key) => {
    const def = registry[key];
    if (def == null) {
      throw new Error(`Missing registry definition for key: ${key}`);
    }

    if (typeof def === 'function') {
      // Span config factory - takes arguments and returns span config
      acc[key] = ((...args: any[]) =>
        (opts?: {
          properties?: DevToolsProperties;
          tooltipText?: string;
          group?: string;
          color?: DevToolsColorToken;
        }) => {
          const config = def(...args);
          return {
            devtools: {
              dataType: 'track-entry',
              track:
                typeof config.track === 'function'
                  ? config.track()
                  : config.track,
              trackGroup: (opts?.group ?? config.group) as any,
              color: opts?.color ?? config.color,
              properties: opts?.properties,
              tooltipText: opts?.tooltipText,
            },
          };
        }) as any;
    } else {
      // Static or dynamic track config
      const config = def as DevtoolsSpanConfig;
      if (typeof config.track === 'function') {
        // Dynamic track based on arguments
        acc[key] = ((...args: any[]) =>
          (opts?: {
            properties?: DevToolsProperties;
            tooltipText?: string;
            group?: typeof config.group;
            color?: DevToolsColorToken;
          }) => ({
            devtools: {
              dataType: 'track-entry',
              track:
                typeof config.track === 'function'
                  ? config.track(...args)
                  : config.track,
              trackGroup: (opts?.group ?? config.group) as any,
              color: opts?.color ?? config.color,
              properties: opts?.properties,
              tooltipText: opts?.tooltipText,
            },
          })) as any;
      } else {
        // Static track
        acc[key] = ((opts?: {
          properties?: DevToolsProperties;
          tooltipText?: string;
          track?: typeof config.track;
          group?: typeof config.group;
          color?: DevToolsColorToken;
        }) => ({
          devtools: {
            dataType: 'track-entry',
            track: (opts?.track ?? config.track) as typeof config.track,
            trackGroup: (opts?.group ?? config.group) as any,
            color: opts?.color ?? config.color,
            properties: opts?.properties,
            tooltipText: opts?.tooltipText,
          },
        })) as any;
      }
    }

    return acc;
  }, {} as any);
}
