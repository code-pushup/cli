import type { DevToolsColor } from './extensibility-api.types';

export type DevtoolsSpanConfig<
  T extends string = string,
  G extends string = string,
> = {
  track: T | ((...args: any[]) => T);
  group?: G;
  color?: DevToolsColor;
  pathPattern?: string | string[];
};

export type DevtoolsSpansRegistry<T extends string = 'main'> = Record<
  T,
  DevtoolsSpanConfig
>;

export type DevtoolsTrackEntryDetail<
  Track extends string = string,
  Group extends string = string,
> = {
  devtools: {
    dataType: 'track-entry';
    track: Track;
    trackGroup?: Group;
    color?: DevToolsColor;
    properties?: [string, string][];
    tooltipText?: string;
  };
};

export type DevtoolsSpanHelpers<R extends Record<string, DevtoolsSpanConfig>> =
  {
    [K in keyof R & string]: R[K]['track'] extends (
      ...args: infer Args
    ) => string
      ? (
          ...args: Args
        ) => (opts?: {
          properties?: [string, string][];
          tooltipText?: string;
          group?: R[K]['group'];
          color?: DevToolsColor;
        }) => DevtoolsTrackEntryDetail<
          ReturnType<R[K]['track']>,
          Extract<R[K]['group'], string>
        >
      : (opts?: {
          properties?: [string, string][];
          tooltipText?: string;
          track?: R[K]['track'];
          group?: R[K]['group'];
          color?: DevToolsColor;
        }) => DevtoolsTrackEntryDetail<
          R[K]['track'],
          Extract<R[K]['group'], string>
        >;
  };

export function createDevtoolsSpans<
  const R extends Record<string, DevtoolsSpanConfig>,
>(registry: R): DevtoolsSpanHelpers<R> {
  type K = keyof R & string;

  return (Object.keys(registry) as K[]).reduce((acc, key) => {
    const def = registry[key];
    if (def == null) {
      throw new Error(`Missing registry definition for key: ${key}`);
    }

    if (typeof def.track === 'function') {
      // Dynamic track based on arguments
      acc[key] = ((...args) =>
        opts => ({
          devtools: {
            dataType: 'track-entry',
            track: def.track(...args),
            trackGroup: (opts?.group ?? def.group) as any,
            color: opts?.color ?? def.color,
            properties: opts?.properties,
            tooltipText: opts?.tooltipText,
          },
        })) as any;
    } else {
      // Static track
      acc[key] = (opts => ({
        devtools: {
          dataType: 'track-entry',
          track: (opts?.track ?? def.track) as R[typeof key]['track'],
          trackGroup: (opts?.group ?? def.group) as any,
          color: opts?.color ?? def.color,
          properties: opts?.properties,
          tooltipText: opts?.tooltipText,
        },
      })) as any;
    }

    return acc;
  }, {} as any);
}

/**
 * Creates a span helper function for a plugin with default color 'secondary-dark'.
 * @param pluginSlug - The plugin identifier (e.g., 'eslint', 'webpack')
 * @returns A function that creates a DevTools track entry detail for the plugin
 */
export function createPluginSpan(
  pluginSlug: string,
): (opts?: {
  group?: string;
  properties?: [string, string][];
  tooltipText?: string;
  color?: DevToolsColor;
}) => DevtoolsTrackEntryDetail {
  return opts => ({
    devtools: {
      dataType: 'track-entry',
      track: `Plugin:${pluginSlug}`,
      trackGroup: opts?.group,
      color: opts?.color ?? 'secondary-dark',
      properties: opts?.properties,
      tooltipText: opts?.tooltipText,
    },
  });
}

/**
 * Creates a span helper function for plugin details with default color 'secondary-light'.
 * @param pluginSlug - The plugin identifier (e.g., 'eslint', 'webpack')
 * @returns A function that creates a DevTools track entry detail for plugin details
 */
export function createPluginDetailsSpan(
  pluginSlug: string,
): (opts?: {
  group?: string;
  properties?: [string, string][];
  tooltipText?: string;
  color?: DevToolsColor;
}) => DevtoolsTrackEntryDetail {
  return opts => ({
    devtools: {
      dataType: 'track-entry',
      track: `Plugin:${pluginSlug}:details`,
      trackGroup: opts?.group,
      color: opts?.color ?? 'secondary-light',
      properties: opts?.properties,
      tooltipText: opts?.tooltipText,
    },
  });
}
