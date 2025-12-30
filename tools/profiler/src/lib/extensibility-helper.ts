import type {
  DevToolsBase,
  DevToolsColorToken,
  DevToolsErrorLabel,
  DevToolsProperties,
  DevToolsTrackEntry,
} from './user-timing-details.type.js';

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

/**
 * Creates a span helper function for a plugin with default color 'secondary-dark'.
 * @param pluginSlug - The plugin identifier (e.g., 'eslint', 'webpack')
 * @returns A function that creates a DevTools track entry detail for the plugin
 */
export function createPluginSpan(pluginSlug: string): (
  opts?: DevToolsBase & {
    group?: string;
  },
) => DevtoolsTrackEntryDetail {
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
export function createPluginDetailsSpan(pluginSlug: string): (
  opts?: DevToolsBase & {
    group?: string;
  },
) => DevtoolsTrackEntryDetail {
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

export type DevtoolsErrorDetail = {
  detail: {
    devtools: DevToolsErrorLabel & {
      properties: DevToolsProperties;
      tooltipText: string;
    };
  };
};

export type ErrorDetailsOptions = {
  errorType?: string;
  errorMessage?: string;
  stackTrace?: string;
  additionalProperties?: [string, string][];
};

export type CreateErrorDetailOptions = {
  measureOptions?: import('node:perf_hooks').MeasureOptions;
} & ErrorDetailsOptions;

/**
 * Creates a DevTools error marker detail with comprehensive error information.
 *
 * @example
 * // Using an Error object directly
 * const detail1 = createErrorDetail(new Error('Something went wrong'));
 *
 * @example
 * // Using error with additional options
 * const detail2 = createErrorDetail(validationError, {
 *   measureOptions: { start: 'mark1', end: 'mark2', detail: { custom: 'data' } },
 *   errorType: 'ValidationError'
 * });
 *
 * @example
 * // Using options object only
 * const detail3 = createErrorDetail(undefined, {
 *   errorType: 'ValidationError',
 *   errorMessage: 'Invalid input',
 *   additionalProperties: [['User ID', '123']]
 * });
 *
 * @param error - Error object (optional)
 * @param options - Additional error details and configuration
 * @returns DevTools error marker detail
 */
/**
 * Merges measurement options with additional options, deeply merging the detail objects.
 *
 * @example
 * // Merge error details with existing measurement options
 * const mergedOptions = mergeOptions(
 *   { start: 'mark1', end: 'mark2', detail: { operation: 'validate' } },
 *   { detail: { devtools: { dataType: 'marker', color: 'error' } } }
 * );
 * // Result: Merged options with error details intelligently combined with original track config
 *
 * @param options - Original measurement options
 * @param additionalOptions - Additional options to merge, with detail objects being deeply merged
 * @returns New measurement options with merged properties
 */
export function mergeOptions(
  options: import('node:perf_hooks').MeasureOptions,
  additionalOptions: import('node:perf_hooks').MeasureOptions = {},
): import('node:perf_hooks').MeasureOptions {
  // Special handling for error details - merge with existing devTools config
  const errorDetail = additionalOptions.detail;
  const originalDetail = options.detail;
  if (
    errorDetail &&
    typeof errorDetail === 'object' &&
    'devtools' in errorDetail &&
    typeof errorDetail.devtools === 'object' &&
    errorDetail.devtools &&
    'dataType' in errorDetail.devtools &&
    'color' in errorDetail.devtools &&
    errorDetail.devtools.dataType === 'marker' &&
    errorDetail.devtools.color === 'error' &&
    originalDetail &&
    typeof originalDetail === 'object' &&
    'devtools' in originalDetail &&
    typeof originalDetail.devtools === 'object' &&
    originalDetail.devtools &&
    'dataType' in originalDetail.devtools
  ) {
    // Merge devTools configurations - keep original track info but override error-related properties
    const mergedDevTools = {
      // Start with original devTools
      ...(originalDetail.devtools as any),
      // Override with error-specific properties but preserve original color
      ...(errorDetail.devtools as any),
      // Force all error spans to be red
      color: 'error',
      // Keep original dataType (track-entry), but merge properties
      dataType:
        (originalDetail.devtools as any).dataType ||
        (errorDetail.devtools as any).dataType,
      // Merge properties arrays
      properties: [
        ...(Array.isArray((originalDetail.devtools as any).properties)
          ? (originalDetail.devtools as any).properties
          : []),
        ...(Array.isArray((errorDetail.devtools as any).properties)
          ? (errorDetail.devtools as any).properties
          : []),
      ],
      // Update tooltip to indicate failure
      tooltipText:
        (errorDetail.devtools as any).tooltipText ||
        `${(originalDetail.devtools as any).tooltipText || 'Operation'} - FAILED`,
    };

    return {
      ...options,
      ...additionalOptions,
      detail: {
        ...originalDetail,
        ...errorDetail,
        devtools: mergedDevTools,
      },
    };
  }

  // Default merging behavior for non-error cases
  const mergedDetail = {
    ...(options.detail && typeof options.detail === 'object'
      ? options.detail
      : {}),
    ...(additionalOptions.detail && typeof additionalOptions.detail === 'object'
      ? additionalOptions.detail
      : {}),
  };

  return {
    ...options,
    ...additionalOptions,
    detail: Object.keys(mergedDetail).length > 0 ? mergedDetail : undefined,
  };
}

export function createDevtoolsErrorDetail(
  error?: Error,
  options: CreateErrorDetailOptions = {},
): DevtoolsErrorDetail {
  const {
    measureOptions,
    errorType,
    errorMessage,
    stackTrace,
    additionalProperties = [],
  } = options;

  const extractedErrorType = error?.name || 'Error';
  const extractedErrorMessage = error?.message || 'Unknown error';
  const extractedStackTrace = error?.stack;

  const finalOptions = {
    errorType: errorType || extractedErrorType,
    errorMessage: errorMessage || extractedErrorMessage,
    stackTrace: stackTrace || extractedStackTrace,
    additionalProperties,
  };

  const {
    errorType: finalErrorType = 'Error',
    errorMessage: finalErrorMessage = 'Unknown error',
    stackTrace: finalStackTrace,
    additionalProperties: finalAdditionalProperties = [],
  } = finalOptions;

  const properties: [string, string][] = [
    ['Error Type', finalErrorType],
    ['Error Message', finalErrorMessage],
  ];
  // Add additional properties
  properties.push(...additionalProperties);

  // Add stack trace if available (truncated to first 3 lines)
  if (finalStackTrace) {
    const stackLines = finalStackTrace.split('\n').slice(0, 3).join('\n');
    properties.push(['Stack Trace', stackLines]);
  }

  return {
    detail: {
      devtools: {
        dataType: 'marker',
        color: 'error',
        properties,
        tooltipText: `${finalErrorType}: ${finalErrorMessage}`,
      },
    },
  };
}

/**
 * Profiler context attached to errors that occur within profiled spans
 */
export interface ProfilerErrorContext {
  /** The name of the span where the error occurred */
  spanName: string;
  /** Unique flow ID for tracking error causality */
  flowId: string;
  /** The error type/class name */
  errorType: string;
  /** Timestamp when the error occurred */
  timestamp: number;
  /** Whether this was a synchronous span error */
  isSpanError?: boolean;
  /** Whether this was an asynchronous span error */
  isAsyncSpanError?: boolean;
}

/**
 * Extracts profiler context from an error if available
 *
 * @param error - The error to extract context from
 * @returns The profiler context if available, undefined otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await profiler.spanAsync('my-operation', async () => {
 *     throw new Error('Something went wrong');
 *   });
 * } catch (error) {
 *   const context = getProfilerErrorContext(error);
 *   if (context) {
 *     console.log(`Error occurred in span: ${context.spanName}`);
 *     console.log(`Flow ID: ${context.flowId}`);
 *   }
 * }
 * ```
 */
export function getProfilerErrorContext(
  error: unknown,
): ProfilerErrorContext | undefined {
  if (error instanceof Error && (error as any).__profilerContext) {
    return (error as any).__profilerContext as ProfilerErrorContext;
  }
  return undefined;
}

/**
 * Checks if an error originated from a profiled span
 *
 * @param error - The error to check
 * @returns true if the error has profiler context, false otherwise
 */
export function isProfilerError(
  error: unknown,
): error is Error & { __profilerContext: ProfilerErrorContext } {
  return error instanceof Error && !!(error as any).__profilerContext;
}
