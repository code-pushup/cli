import {
  type PerformanceEntry,
  type PerformanceMark,
  type PerformanceMeasure,
  performance,
} from 'node:perf_hooks';
import process from 'node:process';
import { defaultClock } from './clock';
import { TraceFileSink } from './file-sink-json-trace.js';
import {
  type PerformanceObserverHandle,
  createPerformanceObserver,
} from './performance-observer';
import {
  type MeasureControl,
  type TrackControl,
  type TrackControlOptions,
  type TrackMeta,
  type TrackStyle,
  getMeasureControl,
  getMeasureMarkNames,
  getTrackControl,
} from './performance-utils.js';
import type {
  ProfilerControl,
  ProfilerEntryOptions,
  ProfilerFileOptions,
} from './profiler.type.js';
import {
  entryToTraceTimestamp,
  getInstantEvent,
  getSpan,
} from './trace-file-utils';
import {
  type BeginEvent,
  type EndEvent,
  type InstantEvent,
  type SpanEvent,
} from './trace-file.type';
import {
  asOptions,
  errorToMarkerPayload,
  errorToTrackEntryPayload,
  markerPayload,
  trackEntryPayload,
} from './user-timing-details-utils.js';
import {
  type EntryMeta,
  type MarkOptionsWithDevtools,
  type MarkerPayload,
  type MeasureOptionsWithDevtools,
  type NativePerformanceAPI,
  type TrackEntryPayload,
  type UserTimingDetail,
} from './user-timing-details.type.js';
import { getFilenameParts, installExitHandlersOnce } from './utils';

function performanceMeasureToSpanEvents(
  entry: PerformanceMeasure,
  options: {
    pid?: number;
    tid?: number;
  } = {},
): [BeginEvent, EndEvent] {
  return getSpan({
    ...options,
    tsB: entryToTraceTimestamp(entry),
    tsE: entryToTraceTimestamp(entry, true),
    name: entry.name,
    args: {
      detail: {
        devtools: (entry.detail as UserTimingDetail)?.devtools,
      },
    },
  });
}

export interface PerformanceAPIExtension<Track extends string> {
  marker(name: string, options: MarkerPayload & { track: Track }): void;

  mark(name: string, options?: TrackEntryPayload & { track: Track }): void;

  measure<T>(
    name: string,
    fn: () => T,
    options?:
      | (Omit<TrackMeta, 'track'> &
          TrackStyle & {
            track?: Track | string;
            success?: (result: T) => Partial<TrackEntryPayload>;
            error?: (err: unknown) => EntryMeta;
          })
      | Track
      | (TrackStyle & TrackMeta),
  ): T;

  measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?:
      | (Omit<TrackMeta, 'track'> &
          TrackStyle & {
            track?: Track | string;
            success?: (result: T) => Partial<TrackEntryPayload>;
            error?: (err: unknown) => EntryMeta;
          })
      | Track
      | (TrackStyle & TrackMeta),
  ): Promise<T>;
}

// Convert performance mark to instant event
function performanceMarkToInstantEvent(
  entryMark: PerformanceMark,
): InstantEvent {
  return getInstantEvent({
    name: entryMark.name,
    ts: defaultClock.fromEntryStartTimeMs(entryMark.startTime),
    args: {
      data: {
        detail: {
          devtools: (entryMark.detail as UserTimingDetail)?.devtools,
        },
      },
    },
  });
}

export const PROFILER_ENV_VAR = 'CP_PROFILING';
export const GROUP_CODEPUSHUP = 'CodePushUp';

const PROFILER_KEY = Symbol.for('codepushup.profiler');

const instantEvenMarker = (opt?: {
  name: string;
  ts?: number;
  devtools: MarkerPayload;
}) => {
  const { devtools, ...traceProps } =
    opt ??
    ({} as {
      name: string;
      ts?: number;
      devtools: MarkerPayload;
    });
  return getInstantEvent({
    ...traceProps,
    args: {
      data: {
        detail: { devtools: markerPayload(devtools) },
      },
    },
  });
};

export function getProfiler<
  Tracks extends Record<string, TrackStyle & TrackMeta>,
>(opts?: ProfilerOptions<Tracks>): Profiler<Tracks> {
  const g = globalThis as any;
  if (!g[PROFILER_KEY] || !g[PROFILER_KEY].isEnabled()) {
    g[PROFILER_KEY] = new Profiler(opts);
  }
  return g[PROFILER_KEY] as Profiler<Tracks>;
}

export interface ProfilerInterface
  extends ProfilerControl,
    PerformanceAPIExtension<string> {}

export type ProfilerControlOptions = {
  enabled?: boolean;
  recoverJsonl?: boolean;
  captureBuffered?: boolean;
};

export type ProfilerOptions<
  Tracks extends Record<string, TrackStyle & TrackMeta> = Record<
    string,
    TrackStyle & TrackMeta
  >,
> = ProfilerControlOptions &
  ProfilerFileOptions &
  TrackControlOptions<Tracks> &
  ProfilerEntryOptions;

export type SpanOptions<Track extends string = string, R = unknown> = Omit<
  TrackMeta,
  'track'
> &
  TrackStyle & {
    track?: Track | string; // Can be track key or track value
    config?: string;
    success?: (result: R) => EntryMeta;
    error?: (err: unknown) => EntryMeta;
  };

export class Profiler<
  Tracks extends Record<string, TrackStyle & TrackMeta> = Record<
    string,
    TrackStyle & TrackMeta
  >,
> implements ProfilerInterface
{
  #enabled = process.env[PROFILER_ENV_VAR] !== 'false';
  #traceFile?: TraceFileSink;
  #performanceObserver?: PerformanceObserverHandle<SpanEvent | InstantEvent>;
  #closed = false;

  measureConfig: TrackControl<Tracks> & MeasureControl;

  constructor(options: ProfilerOptions<Tracks> = {}) {
    const {
      enabled = process.env[PROFILER_ENV_VAR] !== 'false',
      captureBuffered,
      recoverJsonl,
      metadata,
      tracks: devtools,
      namePrefix,
      ...pathOptions
    } = options;
    const trackControl = getTrackControl<Tracks>({ tracks: devtools });

    this.measureConfig = {
      ...trackControl,
      ...getMeasureControl(namePrefix),
    };

    this.#enabled = enabled;
    if (!this.#enabled) return;
    try {
      this.#traceFile = new TraceFileSink({
        ...getFilenameParts(pathOptions),
        metadata,
      });
      this.#traceFile.open(!!recoverJsonl);

      this.#performanceObserver = createPerformanceObserver<
        SpanEvent | InstantEvent
      >({
        captureBuffered,
        encode: (entry: PerformanceEntry): (SpanEvent | InstantEvent)[] => {
          switch (entry.entryType) {
            case 'mark':
              return [performanceMarkToInstantEvent(entry as PerformanceMark)];
            case 'measure':
              return performanceMeasureToSpanEvents(
                entry as PerformanceMeasure,
              );
            default:
              return [];
          }
        },
        sink: this.#traceFile,
      });

      this.#performanceObserver.connect();

      this.#performanceObserver?.flush();

      installExitHandlersOnce({
        onFatal: (error, kind) => this.#handleFatalError(error, kind),
        onClose: () => this.close(),
      });
    } catch (e) {
      console.error(`\x1b[31mFailed to initialize profiler:\x1b[0m`, e);
      this.#enabled = false;
    }
  }

  #handleFatalError(error: unknown, kind?: string): void {
    if (!this.#traceFile) return;

    const errorName =
      error instanceof Error ? error.name : (kind ?? 'UnknownError');

    const fatalErrorEvent = instantEvenMarker({
      name: `PROCESS:FATAL-ERROR: ${errorName}`,
      devtools: errorToMarkerPayload(error),
    });

    try {
      this.#traceFile.write(fatalErrorEvent);
    } catch (writeError) {
      // Silently ignore write errors (e.g., EBADF in test environments with mocked fs)
    }

    this.close();
    throw error;
  }

  isEnabled(): boolean {
    return this.#enabled;
  }

  enableProfiling(isEnabled: boolean): void {
    this.#enabled = isEnabled;
  }

  getFilePathForExt(ext: 'json' | 'jsonl'): string {
    return this.#traceFile?.getFilePathForExt(ext) ?? '';
  }

  flush(): void {
    if (this.#closed) return;
    this.#performanceObserver?.flush();
  }

  marker(
    name: string,
    options?: Omit<MarkerPayload, 'dataType'>,
  ): PerformanceMark {
    return performance.mark(
      name,
      asOptions(
        markerPayload({
          ...options,
          ...this.measureConfig.tracks.defaultTrack,
        }),
      ),
    );
  }

  mark(
    name: string,
    options?: string | (Omit<TrackEntryPayload, 'track'> & { track?: string }),
  ): PerformanceMark {
    const { startName } = this.measureConfig.getNames(name);
    const opt = this.prepMeta(options);
    return performance.mark(startName, asOptions(trackEntryPayload(opt)));
  }

  private prepSuccessCallback<T>(
    options?:
      | string
      | (TrackStyle & Partial<TrackMeta>)
      | (Omit<TrackMeta, 'track'> &
          TrackStyle & {
            track?: string;
            success?: (result: T) => Partial<TrackEntryPayload>;
            error?: (err: unknown) => EntryMeta;
          }),
  ): (result: T) => Partial<TrackEntryPayload> {
    return options && typeof options === 'object' && 'success' in options
      ? (options.success ?? ((result: T) => ({})))
      : (result: T) => ({});
  }

  private prepErrorCallback<T>(
    options:
      | string
      | (TrackStyle & Partial<TrackMeta>)
      | (Omit<TrackMeta, 'track'> &
          TrackStyle & {
            track?: string;
            success?: (result: T) => Partial<TrackEntryPayload>;
            error?: (err: unknown) => EntryMeta;
          })
      | undefined,
  ): (err: unknown) => EntryMeta {
    const baseOptions =
      typeof options === 'string'
        ? this.measureConfig.tracks[options]
        : options;

    const { error } = (baseOptions || {}) as Omit<TrackMeta, 'track'> &
      TrackStyle & {
        track?: string;
        success?: (result: T) => EntryMeta;
        error?: (err: unknown) => EntryMeta;
      };

    const profilerErrorHandler = this.measureConfig.errorHandler;

    return error
      ? (err: unknown): EntryMeta => {
          return { ...profilerErrorHandler(err), ...error(err) };
        }
      : profilerErrorHandler;
  }

  private prepMeta<T>(
    options:
      | string
      | (TrackStyle & Partial<TrackMeta>)
      | (Omit<TrackMeta, 'track'> &
          TrackStyle & {
            track?: string;
            success?: (result: T) => Partial<TrackEntryPayload>;
            error?: (err: unknown) => EntryMeta;
          })
      | undefined,
  ): TrackStyle & TrackMeta {
    const profilerDefaultTrack = this.measureConfig.tracks.defaultTrack;
    const baseOptions = {
      ...profilerDefaultTrack,
      ...(typeof options === 'string'
        ? this.measureConfig.tracks[options]
        : options),
    };

    const { error: _, success: __, ...devtoolsPayload } = baseOptions as any;

    // Ensure track is included from default if not specified
    return {
      track: devtoolsPayload.track || profilerDefaultTrack.track || 'Main',
      ...devtoolsPayload,
    } as TrackStyle & TrackMeta;
  }

  measure<T>(
    name: string,
    fn: () => T,
    options?:
      | string
      | (Omit<TrackMeta, 'track'> &
          TrackStyle & {
            track?: string;
            success?: (result: T) => Partial<TrackEntryPayload>;
            error?: (err: unknown) => EntryMeta;
          }),
  ): T {
    if (!this.#enabled) {
      return fn();
    }

    const metaPayload = this.prepMeta(options);
    const { startName, endName } = this.measureConfig.getNames(name);

    performance.mark(startName, asOptions(trackEntryPayload(metaPayload)));

    try {
      const result = fn();
      performance.mark(endName, asOptions(trackEntryPayload(metaPayload)));
      const successCallback = this.prepSuccessCallback(options);

      performance.measure(name, {
        start: startName,
        end: endName,
        ...asOptions(
          trackEntryPayload({ ...metaPayload, ...successCallback?.(result) }),
        ),
      });
      return result;
    } catch (err) {
      performance.mark(
        endName,
        asOptions(errorToTrackEntryPayload(err, metaPayload)),
      );
      const errorCallback = this.prepErrorCallback(options);

      performance.measure(name, {
        start: startName,
        end: endName,
        ...asOptions(
          trackEntryPayload({ ...metaPayload, ...errorCallback(err) }),
        ),
      });
      throw err;
    }
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?:
      | string
      | (TrackStyle & Partial<TrackMeta>)
      | (Omit<TrackMeta, 'track'> &
          TrackStyle & {
            track?: string;
            success?: (result: T) => Partial<TrackEntryPayload>;
            error?: (err: unknown) => EntryMeta;
          }),
  ): Promise<T> {
    if (!this.#enabled) {
      return fn();
    }

    const metaPayload = this.prepMeta(options);
    const { startName, measureName, endName } = getMeasureMarkNames(name);

    performance.mark(startName, asOptions(trackEntryPayload(metaPayload)));
    try {
      const result = await Promise.resolve().then(fn);
      const successCallback = this.prepSuccessCallback(options);
      performance.mark(endName, asOptions(trackEntryPayload(metaPayload)));
      performance.measure(measureName, {
        start: startName,
        end: endName,
        ...asOptions(
          trackEntryPayload({
            ...metaPayload,
            ...successCallback?.(result),
          }),
        ),
      });
      return result;
    } catch (err) {
      performance.mark(
        endName,
        asOptions(errorToTrackEntryPayload(err, metaPayload)),
      );
      const errorCallback = this.prepErrorCallback(options);
      performance.measure(measureName, {
        start: startName,
        end: endName,
        ...asOptions(
          trackEntryPayload({ ...metaPayload, ...errorCallback(err) }),
        ),
      });
      throw err;
    }
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.enableProfiling(false);

    this.#performanceObserver?.close();
    this.#performanceObserver = undefined;

    try {
      this.#traceFile?.finalize();
    } catch (e) {
      console.warn('[profiler] trace finalize failed', e);
    }
    this.#traceFile = undefined;
  }
}
