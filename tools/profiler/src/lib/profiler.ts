import path from 'node:path';
import {
  type MarkOptions,
  type PerformanceMark,
  type PerformanceMeasure,
  performance,
} from 'node:perf_hooks';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import {
  type PerformanceObserverHandle,
  createPerformanceObserver,
} from './performance-observer';
import {
  type DevToolsOptionCb,
  measureAsync,
  measureSync,
} from './profiler-utils.js';
import type { ProfilerMethods } from './profiler-utils.js';
import { type TraceFile, createTraceFile } from './trace-file-output';
import {
  errorToInstantEvent,
  relativeToAbsuloteTime,
  timingEventToTraceEvent as userTimingEventToTraceEvent,
} from './trace-file-utils';
import {
  type DevtoolsSpanConfig,
  type DevtoolsSpanHelpers,
  type DevtoolsSpansRegistry,
  createDevtoolsSpans,
} from './user-timing-details-utils.js';
import { getFilenameParts, installExitHandlersOnce } from './utils';

export type ProfilerOptions<K extends string = never> = {
  enabled?: boolean;
  captureBuffered?: boolean;
  recoverExisting?: boolean;
  outDir?: string;
  fileBaseName?: string;
  metadata?: Record<string, unknown>;
  spans?: Partial<DevtoolsSpansRegistry<K>>;
};

export const PROFILER_ENV_VAR = 'CP_PROFILING';
export const GROUP_CODEPUSHUP = 'CodePushUp';

const DEFAULT_MAIN_SPAN = {
  group: GROUP_CODEPUSHUP,
  track: 'CLI',
  color: 'tertiary-dark',
} as const satisfies DevtoolsSpanConfig;

const PROFILER_KEY = Symbol.for('codepushup.profiler');

export function getProfiler<K extends string = string>(
  opts?: ProfilerOptions<K>,
) {
  const g = globalThis as any;
  if (!g[PROFILER_KEY]) g[PROFILER_KEY] = new Profiler(opts);
  return g[PROFILER_KEY] as Profiler<any> as Profiler<K>;
}

export class Profiler<K extends string = never> implements ProfilerMethods {
  #enabled = process.env[PROFILER_ENV_VAR] !== 'false';

  #traceFile?: TraceFile;
  #performanceObserver?: PerformanceObserverHandle;
  #outputFileFinal: string;
  #closed = false;

  readonly #spansRegistry: DevtoolsSpansRegistry<K | 'main'>;
  readonly #spans: DevtoolsSpanHelpers<DevtoolsSpansRegistry<K | 'main'>>;

  constructor(options: ProfilerOptions<K> = {}) {
    const {
      enabled = process.env[PROFILER_ENV_VAR] === 'true',
      captureBuffered,
      metadata,
      spans,
      recoverExisting,
      ...pathOptions
    } = options;
    this.enableProfiling(enabled);

    const parts = getFilenameParts(pathOptions);
    this.#outputFileFinal = path.resolve(
      parts.directory,
      `${parts.filename}.json`,
    );

    this.#spansRegistry = {
      ...(options.spans ?? {}),
      main: DEFAULT_MAIN_SPAN,
    } as DevtoolsSpansRegistry<K | 'main'>;

    this.#spans = createDevtoolsSpans(this.#spansRegistry);

    if (!this.#enabled) return;

    try {
      this.#traceFile = createTraceFile({
        filename: parts.filename,
        directory: parts.directory,
        flushEveryN: 200,
      });

      this.#performanceObserver = createPerformanceObserver({
        captureBuffered,
        processEvent: event => {
          for (const te of userTimingEventToTraceEvent(event, {
            pid: process.pid,
            tid: threadId,
            ts: relativeToAbsuloteTime(undefined, event.startTime),
          })) {
            this.#traceFile!.write(te);
          }
        },
      });

      // initially flush any buffered entries
      this.#performanceObserver?.flush();

      installExitHandlersOnce({
        onFatal: (kind, error) => {
          if (this.#traceFile) {
            this.#traceFile.write(
              errorToInstantEvent(error, {
                pid: process.pid,
                tid: threadId,
              }),
            );
          }
          this.close();
          throw error;
        },
        onClose: () => this.close(),
      });
    } catch (e) {
      console.error('Failed to initialize profiler:', e);
      this.#enabled = false;
      return;
    }
  }

  get spans() {
    return this.#spans;
  }

  get enabled() {
    return this.#enabled;
  }

  get filePath() {
    return this.#outputFileFinal;
  }

  enableProfiling(isEnabled: boolean): void {
    this.#enabled = isEnabled;
  }

  mark(
    markName: string,
    markOptions?: PerformanceMarkOptions,
  ): PerformanceMark {
    // TODO: Add automatic detection of detail from spans registry
    return performance.mark(markName, markOptions);
  }

  measure(measureName: string): PerformanceMeasure;
  measure(measureName: string, startMark: string): PerformanceMeasure;
  measure(
    measureName: string,
    startMark: string,
    endMark: string,
  ): PerformanceMeasure;
  measure(
    measureName: string,
    options: PerformanceMeasureOptions,
  ): PerformanceMeasure;
  measure(
    measureName: string,
    startOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ): PerformanceMeasure {
    // TODO: Add automatic detection of detail from spans registry
    return typeof startOrOptions === 'string' || startOrOptions === undefined
      ? performance.measure(measureName, {
          start: startOrOptions,
          end: endMark,
        })
      : performance.measure(measureName, startOrOptions);
  }

  spanAsync<T = unknown>(
    spanName: string,
    fn: () => Promise<T>,
    options?: DevToolsOptionCb<T>,
  ): Promise<T> {
    return measureAsync(this, spanName, fn, options);
  }

  span<T = unknown>(
    spanName: string,
    fn: () => T,
    options?: DevToolsOptionCb<T>,
  ): T {
    return measureSync(this, spanName, fn, options);
  }

  instant(name: string, options?: MarkOptions): PerformanceMark {
    // TODO: Add automatic detection of detail from spans registry
    return this.mark(name, options);
  }

  flush(): void {
    this.#traceFile?.flush();
  }

  close(): void {
    if (this.#closed) return;
    this.#enabled = false; // Stop recording immediately

    try {
      this.flush();
    } catch (e) {
      console.warn('[profiler] flush failed', e);
    }

    this.#closed = true;

    try {
      this.#performanceObserver?.disconnect();
    } catch (e) {
      console.warn('[profiler] observer disconnect failed', e);
    }
    this.#performanceObserver = undefined;

    try {
      this.#traceFile?.close();
    } catch (e) {
      console.warn('[profiler] trace close failed', e);
    }
    this.#traceFile = undefined;
  }
}
