import path from 'node:path';
import {
  type MarkOptions,
  type MeasureOptions,
  type PerformanceMark,
  type PerformanceMeasure,
  performance,
} from 'node:perf_hooks';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import {
  type DevtoolsSpanConfig,
  type DevtoolsSpanHelpers,
  type DevtoolsSpansRegistry,
  createDevtoolsSpans,
} from './extensibility-helper';
import {
  type PerformanceObserverHandle,
  createPerformanceObserver,
} from './performance-observer';
import { timingEventToTraceEvent as userTimingEventToTraceEvent } from './trace-events-helper';
import type { InstantEvent } from './trace-events.types';
import {
  type TraceFile,
  createTraceFile,
  errorToTraceEvent,
  markToTraceEvent,
} from './trace-file-output';
import { getFilenameParts, installExitHandlersOnce } from './utils';

type MarkOpts = MarkOptions & { detail?: unknown };

type FatalKind = 'uncaughtException' | 'unhandledRejection';

const errorDetails = (e: unknown) =>
  e instanceof Error
    ? { name: e.name, message: e.message }
    : { name: 'UnknownError', message: String(e) };

const EXIT_HANDLERS_INSTALLED = Symbol.for(
  'codepushup.exit-handlers-installed',
);

const SIGNALS = [
  ['SIGINT', 130],
  ['SIGTERM', 143],
  ['SIGQUIT', 131],
] as const;

export type ProfilerOptions<K extends string = never> = {
  enabled?: boolean;
  outDir?: string;
  fileBaseName?: string;
  id?: string;
  metadata?: Record<string, unknown>;
  spans?: Partial<DevtoolsSpansRegistry<K>>;
};

export const PROFILER_ENV_VAR = 'CP_PROFILING';
export const PROFILER_OUT_DIR = path.join('tmp', 'profiles');
export const PROFILER_FILE_BASE_NAME = 'timing.profile';
export const GROUP_CODEPUSHUP = 'CodePushUp';

const DEFAULT_MAIN_SPAN = {
  group: GROUP_CODEPUSHUP,
  track: 'CLI',
  color: 'tertiary-dark',
} as const satisfies DevtoolsSpanConfig;

const PROFILER_KEY = Symbol.for('codepushup.profiler');

function getAutoDetectedDetail(_: DevtoolsSpansRegistry<any>): undefined {
  return undefined;
}

export function getProfiler<K extends string = never>(
  opts?: ProfilerOptions<K>,
) {
  const g = globalThis as any;
  if (!g[PROFILER_KEY]) g[PROFILER_KEY] = new Profiler(opts);
  return g[PROFILER_KEY] as Profiler<any> as Profiler<K>;
}

export class Profiler<K extends string = never> {
  #enabled = process.env[PROFILER_ENV_VAR] !== 'false';

  #traceFile?: TraceFile;
  #performanceObserver?: PerformanceObserverHandle;
  #outputFileFinal: string;
  #closed = false;

  #measureDetails = new Map<string, any>();
  #markDetails = new Map<string, any>();

  readonly #spansRegistry: DevtoolsSpansRegistry<K | 'main'>;
  readonly #spans: DevtoolsSpanHelpers<DevtoolsSpansRegistry<K | 'main'>>;

  constructor(options: ProfilerOptions<K> = {}) {
    const enabled =
      options.enabled ?? process.env[PROFILER_ENV_VAR] !== 'false';
    this.enableProfiling(enabled);

    const parts = getFilenameParts(options);
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
        captureBuffered: true,
        writeEvent: event => {
          for (const te of userTimingEventToTraceEvent(
            event,
            process.pid,
            threadId,
            this.#measureDetails,
            this.#markDetails,
          )) {
            this.#traceFile!.write(te);
          }
        },
      });
      // initially flush any buffered entries
      // this.#performanceObserver?.flush()

      installExitHandlersOnce({
        onFatal: (kind, err) => {
          this.#writeFatalError(err);
          this.close(); // Ensures the trace file is written before re-throwing
          throw err; // Re-throw after cleanup
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

  mark(name: string, options?: MarkOpts): PerformanceMark | undefined {
    if (!this.#enabled) return undefined;
    return performance.mark(name, options);
  }

  measure(
    name: string,
    startMark?: string,
    endMark?: string,
  ): PerformanceMeasure;
  measure(name: string, options: MeasureOptions): PerformanceMeasure;
  measure(
    name: string,
    a?: string | MeasureOptions,
    b?: string,
  ): PerformanceMeasure {
    return typeof a === 'string' || a === undefined
      ? performance.measure(name, { start: a, end: b })
      : performance.measure(name, a);
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

  #withSpan<T>(name: string, options: MarkOpts | undefined, run: () => T): T {
    if (!this.#enabled) return run();

    const start = `${name}:start`;
    const end = `${name}:end`;

    // Store measure detail for later retrieval during event processing
    if (options?.detail) {
      this.#measureDetails.set(name, options.detail);
    }

    this.#markWithDetail(start, options);
    try {
      return run();
    } finally {
      this.mark(end);
      this.measure(name, start, end);
    }
  }

  async spanAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?: MarkOpts,
  ): Promise<T>;
  spanAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => MarkOpts;
      onError?: (error: unknown) => MarkOpts;
    },
  ): Promise<T>;
  async spanAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?:
      | MarkOpts
      | {
          onSuccess?: (result: T) => MarkOpts;
          onError?: (error: unknown) => MarkOpts;
        },
  ): Promise<T> {
    if (!this.#enabled) return fn();

    if (
      options &&
      typeof options === 'object' &&
      ('onSuccess' in options || 'onError' in options)
    ) {
      const callbackOpts = options as {
        onSuccess?: (result: T) => MarkOpts;
        onError?: (error: unknown) => MarkOpts;
      };

      const start = `${name}:start`;
      const end = `${name}:end`;

      this.#markWithDetail(start, undefined);
      try {
        const result = await fn();
        const spanOpts = callbackOpts.onSuccess?.(result);
        if (spanOpts?.detail) {
          this.#measureDetails.set(name, spanOpts.detail);
        }
        return result;
      } catch (error) {
        const spanOpts = callbackOpts.onError?.(error);
        if (spanOpts?.detail) {
          this.#measureDetails.set(name, spanOpts.detail);
        }
        // Add error marker detail to the end mark for proper error visualization
        const endMarkName = `${name}:end`;
        this.#markDetails.set(endMarkName, {
          devtools: {
            dataType: 'marker',
            color: 'error',
            properties: [
              ['Error Type', errorDetails(error).name],
              ['Error Message', errorDetails(error).message],
            ],
            tooltipText: `${errorDetails(error).name}: ${errorDetails(error).message}`,
          },
        });
        throw error;
      } finally {
        this.mark(end);
        this.measure(name, start, end);
      }
    } else {
      const start = `${name}:start`;
      const end = `${name}:end`;

      // Store measure detail for later retrieval during event processing
      if ((options as MarkOpts)?.detail) {
        this.#measureDetails.set(name, (options as MarkOpts).detail);
      }

      this.#markWithDetail(start, options as MarkOpts);
      try {
        return await fn();
      } finally {
        this.mark(end);
        this.measure(name, start, end);
      }
    }
  }

  span<T>(name: string, fn: () => T, options?: MarkOpts): T;
  span<T>(
    name: string,
    fn: () => T,
    options: {
      onSuccess?: (result: T) => MarkOpts;
      onError?: (error: unknown) => MarkOpts;
    },
  ): T;
  span<T>(
    name: string,
    fn: () => T,
    options?:
      | MarkOpts
      | {
          onSuccess?: (result: T) => MarkOpts;
          onError?: (error: unknown) => MarkOpts;
        },
  ): T {
    if (
      options &&
      typeof options === 'object' &&
      ('onSuccess' in options || 'onError' in options)
    ) {
      const callbackOpts = options as {
        onSuccess?: (result: T) => MarkOpts;
        onError?: (error: unknown) => MarkOpts;
      };
      return this.#withSpan(name, undefined, () => {
        try {
          const result = fn();
          const spanOpts = callbackOpts.onSuccess?.(result);
          if (spanOpts?.detail) {
            this.#measureDetails.set(name, spanOpts.detail);
          }
          return result;
        } catch (error) {
          const spanOpts = callbackOpts.onError?.(error);
          if (spanOpts?.detail) {
            this.#measureDetails.set(name, spanOpts.detail);
          }
          // Add error marker detail to the end mark for proper error visualization
          const endMarkName = `${name}:end`;
          this.#markDetails.set(endMarkName, {
            devtools: {
              dataType: 'marker',
              color: 'error',
              properties: [
                ['Error Type', errorDetails(error).name],
                ['Error Message', errorDetails(error).message],
              ],
              tooltipText: `${errorDetails(error).name}: ${errorDetails(error).message}`,
            },
          });
          throw error;
        }
      });
    } else {
      return this.#withSpan(name, options as MarkOpts, fn);
    }
  }

  instant(name: string, options?: MarkOpts): void;
  instant<T>(
    name: string,
    fn: () => T,
    options: {
      onSuccess?: (result: T) => MarkOpts;
      onError?: (error: unknown) => MarkOpts;
    },
  ): T;
  instant<T>(
    name: string,
    fnOrOptions?: (() => T) | MarkOpts,
    callbackOpts?: {
      onSuccess?: (result: T) => MarkOpts;
      onError?: (error: unknown) => MarkOpts;
    },
  ): T | void {
    if (typeof fnOrOptions === 'function' && callbackOpts) {
      // Work function with callback options
      const fn = fnOrOptions;
      try {
        const result = fn();
        const markOpts = callbackOpts.onSuccess?.(result);
        if (this.#enabled) {
          this.#markWithDetail(name, markOpts);
        }
        return result;
      } catch (error) {
        const markOpts = callbackOpts.onError?.(error);
        if (this.#enabled) {
          this.#markWithDetail(name, markOpts);
        }
        throw error;
      }
    } else {
      // Normal instant case
      const opts = fnOrOptions as MarkOpts | undefined;
      if (!this.#enabled) return;
      this.#markWithDetail(name, opts);
    }
  }

  #markWithDetail(name: string, options?: MarkOpts): void {
    const detail =
      options?.detail ?? getAutoDetectedDetail(this.#spansRegistry);
    this.mark(
      name,
      detail === undefined ? options : { ...(options ?? {}), detail },
    );
  }

  #writeFatalError(error: unknown): void {
    if (this.#closed || !this.#traceFile) return;

    const fatal: InstantEvent = errorToTraceEvent(error, {
      pid: process.pid,
      tid: threadId,
    });
    this.#traceFile.write(fatal);
  }
}
