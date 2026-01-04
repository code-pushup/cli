import {
  type PerformanceEntry,
  type PerformanceMark,
  type PerformanceMeasure,
  performance,
} from 'node:perf_hooks';
import process from 'node:process';
import { defaultClock } from './clock';
import { TraceFileSink } from './output-trace-json.js';
import {
  type PerformanceObserverHandle,
  createPerformanceObserver,
} from './performance-observer';
import {
  type MeasureControl,
  type PerformanceAPIExtension,
  type TrackControl,
  type TrackControlOptions,
  type TrackMeta,
  type TrackStyle,
  getMeasureControl,
  getTrackControl,
  span,
  spanAsync,
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

const instantEvenMarker = (opt: {
  name: string;
  ts?: number;
  devtools: MarkerPayload;
}) => {
  const { devtools, ...traceProps } = opt;
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
>(opts: ProfilerOptions<Tracks>): Profiler<Tracks>;
export function getProfiler(opts?: ProfilerOptions): Profiler {
  const g = globalThis as any;
  if (!g[PROFILER_KEY] || !g[PROFILER_KEY].isEnabled()) {
    g[PROFILER_KEY] = new Profiler(opts);
  }
  return g[PROFILER_KEY] as Profiler;
}

export interface ProfilerInterface
  extends ProfilerControl,
    PerformanceAPIExtension<string>,
    NativePerformanceAPI {}

export type ProfilerControlOptions = {
  enabled?: boolean;
  captureBuffered?: boolean;
  recoverJsonl?: boolean;
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
      devtools,
      namePrefix,
      ...pathOptions
    } = options;
    const trackControl = getTrackControl(devtools);

    this.measureConfig = {
      ...trackControl,
      ...getMeasureControl(namePrefix),
    };

    this.#enabled = enabled;
    if (!this.#enabled) return;
    try {
      this.#traceFile = new TraceFileSink({
        ...getFilenameParts(pathOptions),
        recoverJsonl,
        metadata,
      });
      this.#traceFile.open();

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

      // Start observing performance entries
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
    this.#traceFile.write(fatalErrorEvent);

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

  instantMarker(name: string, options: Omit<MarkerPayload, 'dataType'>): void {
    performance.mark(name, asOptions(markerPayload(options)));
  }

  instantTrackEntry(
    name: string,
    options?: Omit<TrackEntryPayload, 'dataType'>,
  ): void {
    const devtools = {
      ...this.measureConfig.tracks.defaultTrack,
      ...options,
    };
    performance.mark(name, asOptions(trackEntryPayload(devtools)));
  }

  mark(name: string, options?: MarkOptionsWithDevtools): PerformanceMark {
    const devtools = {
      ...this.measureConfig.tracks.defaultTrack,
      ...options,
    };
    return performance.mark(name, asOptions(trackEntryPayload(devtools)));
  }

  measure(
    name: string,
    options: MeasureOptionsWithDevtools,
  ): PerformanceMeasure;
  measure(
    name: string,
    startMark?: string,
    endMark?: string,
  ): PerformanceMeasure;
  measure(
    name: string,
    startMarkOrOptions?: string | MeasureOptionsWithDevtools,
    endMark?: string,
  ): PerformanceMeasure {
    if (typeof startMarkOrOptions === 'string') {
      return performance.measure(name, startMarkOrOptions, endMark);
    } else if (startMarkOrOptions) {
      const trackAndColor = {
        ...startMarkOrOptions,
        detail: {
          ...startMarkOrOptions.detail,
          devtools: {
            ...this.measureConfig.tracks.defaultTrack,
            ...startMarkOrOptions.detail?.devtools,
          },
        },
      };
      return performance.measure(name, trackAndColor);
    } else {
      return performance.measure(name);
    }
  }

  span<Result>(
    name: string,
    fn: () => Result,
    optionsOrConfig?:
      | SpanOptions<Extract<keyof Tracks, string>, Result>
      | Extract<keyof Tracks, string>,
  ): Result {
    let spanOptions =
      typeof optionsOrConfig === 'string'
        ? (this.measureConfig.tracks[optionsOrConfig] as SpanOptions<
            Extract<keyof Tracks, string>,
            Result
          >)
        : (optionsOrConfig ??
          ({} as SpanOptions<Extract<keyof Tracks, string>, Result>));

    const { error, success, ...opt } = spanOptions;
    const globalErrorHandler = this.measureConfig.errorHandler;
    return span(name, fn, {
      ...this.measureConfig.tracks.defaultTrack,
      ...opt,
      error: globalErrorHandler
        ? (err: unknown) => ({
            color: 'error',
            ...globalErrorHandler(err),
            ...error?.(err),
          })
        : error,
      success,
    });
  }

  spanAsync<Result>(
    name: string,
    fn: () => Promise<Result>,
    optionsOrConfig?: SpanOptions<Extract<keyof Tracks, string>, Result>,
  ): Promise<Result> {
    let spanOptions =
      typeof optionsOrConfig === 'string'
        ? (this.measureConfig.tracks[optionsOrConfig] as SpanOptions<
            Extract<keyof Tracks, string>,
            Result
          >)
        : (optionsOrConfig ??
          ({} as SpanOptions<Extract<keyof Tracks, string>, Result>));

    const { error, success, ...opt } = spanOptions;
    const globalErrorHandler = this.measureConfig.errorHandler;

    const finalOptions = {
      ...this.measureConfig.tracks.defaultTrack,
      ...opt,
      error: globalErrorHandler
        ? (err: unknown) => {
            const globalMeta = globalErrorHandler(err);
            const localMeta = error?.(err);
            return {
              ...globalMeta,
              ...localMeta,
            };
          }
        : error,
      success,
    };
    return spanAsync(name, fn, finalOptions);
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
