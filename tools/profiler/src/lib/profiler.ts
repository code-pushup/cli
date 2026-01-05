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
  type DevToolsOptionCb,
  type MeasureControl,
  type PerformanceAPIExtension,
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
      devtools,
      namePrefix,
      ...pathOptions
    } = options;
    const trackControl = getTrackControl<Tracks>(devtools);

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

  marker(
    name: string,
    options?: Omit<MarkerPayload, 'dataType'>,
  ): PerformanceMark {
    const { startName } = this.measureConfig.getNames(name);
    return performance.mark(
      startName,
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
    options?: Omit<TrackEntryPayload, 'track'> & { track?: string },
  ): PerformanceMark {
    const { startName } = this.measureConfig.getNames(name);
    return performance.mark(
      startName,
      asOptions(
        trackEntryPayload({
          ...this.measureConfig.tracks.defaultTrack,
          ...options,
        }),
      ),
    );
  }

  private prepareDevToolsOptions<T>(
    options:
      | string
      | (TrackStyle & Partial<TrackMeta>)
      | DevToolsOptionCb<string, T>
      | undefined,
  ): {
    error?: (err: unknown) => EntryMeta;
    success?: (result: T) => EntryMeta;
  } & DevToolsOptionCb<string, T> {
    const profilerDefaultTrack = this.measureConfig.tracks.defaultTrack;
    let {
      error: errorHandler,
      success,
      ...devtoolsPayload
    }: DevToolsOptionCb<string, T> = {
      ...profilerDefaultTrack,
      ...(typeof options === 'string'
        ? this.measureConfig.tracks[options]
        : options),
    };

    return { error: errorHandler, success, ...devtoolsPayload };
  }

  measure<T>(
    name: string,
    fn: () => T,
    options?:
      | string
      | (TrackStyle & Partial<TrackMeta>)
      | DevToolsOptionCb<string, T>,
  ): T {
    const profilerErrorHandler = this.measureConfig.errorHandler;
    const { error, success, devtoolsPayload } =
      this.prepareDevToolsOptions(options);

    const { startName, measureName, endName } = getMeasureMarkNames(name);

    performance.mark(startName, asOptions(trackEntryPayload(devtoolsPayload)));
    try {
      const result = fn();
      performance.measure(measureName, {
        start: startName,
        ...asOptions(
          trackEntryPayload({
            ...devtoolsPayload,
            ...success?.(result),
          }),
        ),
      });
      return result;
    } catch (err) {
      const errorHandler = error
        ? (err: unknown): EntryMeta => {
            return { ...profilerErrorHandler(err), ...error(err) };
          }
        : profilerErrorHandler;
      performance.mark(
        endName,
        asOptions(errorToTrackEntryPayload(err, devtoolsPayload)),
      );
      performance.measure(measureName, {
        start: startName,
        end: endName,
        ...errorHandler(err),
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
      | DevToolsOptionCb<string, T>,
  ): Promise<T> {
    const profilerErrorHandler = this.measureConfig.errorHandler;
    const { error, success, ...devtoolsPayload } =
      this.prepareDevToolsOptions(options);

    const { startName, measureName, endName } = getMeasureMarkNames(name);

    performance.mark(startName, asOptions(trackEntryPayload(devtoolsPayload)));
    try {
      const result = await fn();
      performance.measure(measureName, {
        start: startName,
        ...asOptions(
          trackEntryPayload({
            ...devtoolsPayload,
            ...success?.(result),
          }),
        ),
      });
      return result;
    } catch (err) {
      const errorHandler = error
        ? (err: unknown): EntryMeta => {
            return { ...profilerErrorHandler(err), ...error(err) };
          }
        : profilerErrorHandler;
      performance.mark(
        endName,
        asOptions(errorToTrackEntryPayload(err, devtoolsPayload)),
      );
      performance.measure(measureName, {
        start: startName,
        end: endName,
        ...errorHandler(err),
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
