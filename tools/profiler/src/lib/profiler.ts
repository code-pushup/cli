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
  type DevToolsOptionCb,
  type MeasureControl,
  PerformanceAPIExtension,
  type TrackControl,
  TrackControlOptions,
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
  EntryMeta,
  type MarkOptionsWithDevtools,
  type MarkerPayload,
  type MeasureOptionsWithDevtools,
  type NativePerformanceAPI,
  type TrackEntryPayload,
  type TrackMeta,
  type TrackStyle,
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

export function getProfiler(opts?: ProfilerOptions) {
  const g = globalThis as any;
  if (!g[PROFILER_KEY] || !g[PROFILER_KEY].isEnabled()) {
    g[PROFILER_KEY] = new Profiler(opts);
  }
  return g[PROFILER_KEY] as Profiler;
}

export interface ProfilerInterface
  extends ProfilerControl,
    PerformanceAPIExtension,
    NativePerformanceAPI {}
export type ProfilerControlOptions = {
  enabled?: boolean;
  captureBuffered?: boolean;
  recoverJsonl?: boolean;
};

export type ProfilerOptions = ProfilerControlOptions &
  ProfilerFileOptions & {
    devtools?: TrackControlOptions;
  } & ProfilerEntryOptions;

export class Profiler implements ProfilerInterface {
  #enabled = process.env[PROFILER_ENV_VAR] !== 'false';
  #traceFile?: TraceFileSink;
  #performanceObserver?: PerformanceObserverHandle<SpanEvent | InstantEvent>;
  #closed = false;

  measureConfig: TrackControl & MeasureControl;
  constructor(options: ProfilerOptions = {}) {
    const {
      enabled = process.env[PROFILER_ENV_VAR] !== 'false',
      captureBuffered,
      recoverJsonl,
      metadata,
      devtools,
      namePrefix,
      ...pathOptions
    } = options;
    this.measureConfig = {
      ...getTrackControl(devtools),
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
    const payload = {
      track: this.measureConfig.defaultTrack.track,
      ...options,
    };
    performance.mark(name, asOptions(trackEntryPayload(payload)));
  }

  mark(name: string, options?: MarkOptionsWithDevtools): PerformanceMark {
    const trackAndColor = {
      ...options,
      detail: {
        ...options?.detail,
        devtools: {
          ...this.measureConfig.defaultTrack,
          ...options?.detail?.devtools,
        },
      },
    };
    return performance.mark(name, trackAndColor);
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
            ...this.measureConfig.defaultTrack,
            ...startMarkOrOptions.detail?.devtools,
          },
        },
      };
      return performance.measure(name, trackAndColor);
    } else {
      return performance.measure(name);
    }
  }

  span<T>(name: string, fn: () => T, options?: DevToolsOptionCb<T>): T {
    const { error, success, ...opt } = options ?? {};
    const globalErrorHandler = this.measureConfig.errorHandler;
    const spanOptions = {
      ...this.measureConfig.defaultTrack,
      ...opt,
      error: globalErrorHandler
        ? (err: unknown) => {
            try {
              const globalMeta = globalErrorHandler(err);
              const localMeta = error?.(err);
              return {
                color: 'error', // Ensure error spans use error color
                ...(globalMeta || {}),
                ...(localMeta || {}),
              };
            } catch (handlerError) {
              // If global handler fails, still try local handler
              console.warn(
                '[profiler] global error handler failed:',
                handlerError,
              );
              return {
                color: 'error', // Ensure error spans use error color
                ...(error?.(err) || {}),
              };
            }
          }
        : error,
      success,
    };
    return span(name, fn, spanOptions);
  }

  spanAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?: DevToolsOptionCb<T>,
  ): Promise<T> {
    const { error, success, ...opt } = options ?? {};
    const globalErrorHandler = this.measureConfig.errorHandler;
    const spanOptions = {
      ...this.measureConfig.defaultTrack,
      ...opt,
      error: globalErrorHandler
        ? (err: unknown) => {
            try {
              const globalMeta = globalErrorHandler(err);
              const localMeta = error?.(err);
              return {
                color: 'error', // Ensure error spans use error color
                ...(globalMeta || {}),
                ...(localMeta || {}),
              };
            } catch (handlerError) {
              // If global handler fails, still try local handler
              console.warn(
                '[profiler] global error handler failed:',
                handlerError,
              );
              return {
                color: 'error', // Ensure error spans use error color
                ...(error?.(err) || {}),
              };
            }
          }
        : error,
      success,
    };
    return spanAsync(name, fn, spanOptions);
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
