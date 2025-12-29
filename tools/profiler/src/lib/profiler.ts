import path from 'node:path';
import {
  type PerformanceMark,
  type PerformanceMeasure,
  performance,
} from 'node:perf_hooks';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import { type MarkOptions, type MeasureOptions } from 'perf_hooks';
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
import {
  type ExtendedPerformanceMark,
  type ExtendedPerformanceMeasure,
  type ProfilingEvent,
} from './trace-file-output';
import { type TraceFile, createTraceFile } from './trace-file-output';

const nextId = createIncrementingId();
const id = nextId();

// Fatal error types for structured error handling
interface FatalError {
  type: 'fatal';
  pid: number;
  tid: number;
  tsMs: number;
  kind: 'uncaughtException' | 'unhandledRejection';
  error:
    | {
        name?: string;
        message?: string;
        stack?: string;
      }
    | unknown;
}

// Profiler-specific error types
class ProfilerError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProfilerError';
  }
}

class ProfilerResourceError extends ProfilerError {
  constructor(operation: string, cause?: unknown) {
    super(`Resource operation failed: ${operation}`, operation, cause);
    this.name = 'ProfilerResourceError';
  }
}

export class ExitHandlerError extends Error {
  constructor(type: string) {
    super(`${type}`);
    this.name = 'ExitHandlerError';
  }
}

export function installExitHandlers({
  envVar = 'EXIT_HANDLERS',
  safeClose,
}: {
  envVar?: string;
  safeClose: (error?: unknown) => void;
}): void {
  if (process.env[envVar] != null) {
    return;
  }
  process.env[envVar] = 'true';

  process.on('beforeExit', () => safeClose());
  process.on('exit', () => safeClose());
  process.on('SIGINT', () => {
    safeClose();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    safeClose();
    process.exit(143);
  });

  process.on('uncaughtException', err => {
    safeClose(new ExitHandlerError('uncaughtException'));
    throw err;
  });

  process.on('unhandledRejection', reason => {
    safeClose(new ExitHandlerError('unhandledRejection'));
  });
}

export type ProfilerOptions<K extends string = never> = {
  enabled?: boolean;
  outDir?: string;
  fileBaseName?: string;
  /** custom id to use in filename instead of timestamp */
  id?: string;
  /** write metadata line once at start */
  metadata?: Record<string, unknown>;
  /** include stack traces in trace events (default: true) */
  includeStackTraces?: boolean;

  /** user spans (main is injected automatically) */
  spans?: Partial<DevtoolsSpansRegistry<K>>;
};

export const PROFILER_ENV_VAR = 'CP_PROFILING';
export const PROFILER_OUT_DIR = path.join('tmp', 'profiles');
export const GROUP_CODEPUSHUP = 'CodePushUp';

const DEFAULT_MAIN_SPAN = {
  group: GROUP_CODEPUSHUP,
  track: 'CLI',
  color: 'tertiary-dark',
} as const satisfies DevtoolsSpanConfig;

const PROFILER_KEY = Symbol.for('codepushup.profiler');
const PROFILER_EXIT_HANDLER_INSTALLED = Symbol.for(
  'codepushup.profiler.exit-handler',
);

function getAutoDetectedDetail(
  _spansRegistry: DevtoolsSpansRegistry<any>,
): undefined {
  // No-op: auto-detection is not implemented
  return undefined;
}

/**
 * Even if the module is loaded twice (different identities, bundling), you still get exactly one instance per process.
 * @param opts
 */
export function getProfiler<K extends string = never>(
  opts?: ProfilerOptions<K>,
) {
  const g = globalThis as any;
  if (!g[PROFILER_KEY]) g[PROFILER_KEY] = new Profiler(opts);
  return g[PROFILER_KEY] as Profiler<K>;
}

export class Profiler<K extends string = never> {
  #envEnabled: string = PROFILER_ENV_VAR;
  #enabled: boolean = Boolean(process.env[this.#envEnabled]);

  #traceFile: TraceFile | undefined;
  #outputFileFinal: string;
  #closed = false;
  #performanceObserver: PerformanceObserverHandle | undefined;
  #creationTs: number;

  readonly #spans: DevtoolsSpanHelpers<DevtoolsSpansRegistry<K | 'main'>>;
  readonly #spansRegistry: DevtoolsSpansRegistry<K | 'main'>;

  constructor(options: ProfilerOptions<K> = {}) {
    this.#creationTs = Math.round(performance.now() * 1000);

    const enabled =
      options.enabled ?? process.env[PROFILER_ENV_VAR] !== 'false';
    this.enableProfiling(enabled);

    const outDir = options.outDir ?? path.join(process.cwd(), PROFILER_OUT_DIR);
    const base = options.fileBaseName ?? 'timing.profile';
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const idOrTimestamp = options.id ?? timestamp;
    const fileName = `${base}.${idOrTimestamp}`;

    this.#outputFileFinal = path.resolve(outDir, `${fileName}.json`);

    const registry = {
      ...(options.spans ?? {}),
      main: DEFAULT_MAIN_SPAN,
    } as DevtoolsSpansRegistry<K | 'main'>;

    this.#spansRegistry = registry;
    this.#spans = createDevtoolsSpans(registry);

    if (!this.#enabled) return;

    try {
      this.#traceFile = createTraceFile({
        filename: fileName,
        directory: outDir,
        flushEveryN: 200,
        includeStackTraces: options.includeStackTraces ?? true,
      });

      this.#performanceObserver = createPerformanceObserver({
        writeEvent: event => this.#traceFile!.write(event),
        captureBuffered: true,
      });

      this.#installExitHandlers({
        envVar: 'CP_PROFILING_EXIT_HANDLERS',
        safeClose: err => {
          if (err) {
            try {
              this.#traceFile?.write({
                type: 'error',
                pid: process.pid,
                tid: threadId,
                tsMs: performance.now(),
                message: err instanceof Error ? err.message : String(err),
                error: err,
              });
            } catch (writeError) {
              // Log the write error but don't throw - we don't want to crash on error logging
              this.#handleError('write error during safeClose', writeError);
            }
          }

          this.close();
        },
      });
    } catch (error) {
      console.error('Failed to initialize profiler:', error);
      this.#enabled = false;
      return;
    }
  }

  get spans(): DevtoolsSpanHelpers<DevtoolsSpansRegistry<K | 'main'>> {
    return this.#spans;
  }

  get enabled(): boolean {
    return this.#enabled;
  }

  get filePath(): string {
    return this.#outputFileFinal;
  }

  #writeFatalError(
    kind: 'uncaughtException' | 'unhandledRejection',
    error: unknown,
  ): void {
    if (!this.#enabled || this.#closed || !this.#traceFile) return;

    try {
      const fatalError: FatalError = {
        type: 'fatal',
        pid: process.pid,
        tid: threadId,
        tsMs: performance.now(),
        kind,
        error:
          kind === 'uncaughtException'
            ? this.#extractErrorDetails(error)
            : error,
      };

      this.#traceFile.write(fatalError);
    } catch (writeError) {
      // Log the write error but don't throw - we don't want to crash on error logging
      console.warn('Failed to write fatal error to trace file:', writeError);
    }
  }

  #extractErrorDetails(error: unknown): FatalError['error'] {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Fallback for non-Error objects
    return {
      name: 'UnknownError',
      message: String(error),
    };
  }

  enableProfiling(isEnabled: boolean): void {
    process.env[this.#envEnabled] = `${isEnabled}`;
    this.#enabled = isEnabled;
  }

  mark(name: string, options?: MarkOptions): PerformanceMark {
    return performance.mark(name, options);
  }

  measure(
    name: string,
    startMark?: string,
    endMark?: string,
  ): PerformanceMeasure | undefined;
  measure(
    name: string,
    options: MeasureOptions,
  ): PerformanceMeasure | undefined;
  measure(
    name: string,
    optionsOrStartMark?: string | MeasureOptions,
    endMark?: string,
  ): PerformanceMeasure {
    // Handle overload: (name, startMark?, endMark?)
    if (
      typeof optionsOrStartMark === 'string' ||
      optionsOrStartMark === undefined
    ) {
      return performance.measure(name, optionsOrStartMark, endMark);
    }

    // Handle overload: (name, options)
    return performance.measure(name, optionsOrStartMark);
  }

  flush(): void {
    if (!this.#enabled || this.#closed || !this.#traceFile) return;

    // Flush performance observer (handles all pending entries)
    this.#performanceObserver?.flush();

    // Flush the trace file
    this.#traceFile?.flush();
  }

  close(): void {
    if (!this.#enabled || this.#closed) return;
    this.#closed = true;

    if (!this.#traceFile) return;

    try {
      // Flush any pending writes before disconnecting observer
      this.flush();
    } catch (error) {
      this.#handleError('flush during close', error);
    }

    // Disconnect PerformanceObserver to prevent callbacks after close
    if (this.#performanceObserver) {
      try {
        this.#performanceObserver.disconnect();
        this.#performanceObserver = undefined;
      } catch (error) {
        this.#handleError('performance observer disconnect', error);
      }
    }

    // Close trace file (includes recovery/finalization)
    if (this.#traceFile) {
      try {
        this.#traceFile.close();
        this.#traceFile = undefined;
      } catch (error) {
        this.#handleError('trace file close', error);
      }
    }

    this.#traceFile = undefined;
  }

  async spanAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?: PerformanceMarkOptions,
  ): Promise<T> {
    const startTime = performance.now();

    // Auto-detect context if detail is not provided in options
    const finalOptions: PerformanceMarkOptions | undefined =
      options?.detail === undefined
        ? { ...options, detail: getAutoDetectedDetail(this.#spansRegistry) }
        : options;

    try {
      return await fn();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Create trace events directly to avoid duplication with the PerformanceObserver
      if (this.#enabled && !this.#closed && this.#traceFile) {
        const timeOriginBase = 1766930000000; // Base to align with Chrome trace format
        const effectiveTimeOrigin = performance.timeOrigin - timeOriginBase;
        const startUs = Math.round((effectiveTimeOrigin + startTime) * 1000);
        const endUs = Math.round((effectiveTimeOrigin + endTime) * 1000);

        const id2 = { local: `0x${Math.random().toString(16).slice(2, 8)}` };

        // Extract link properties from options and put them at top level
        const options = finalOptions as any; // Cast to any to access link properties
        const { id, parentId, flowIn, flowOut, detail, ...otherOptions } =
          options || {};

        const mergedDetail = detail ? JSON.stringify(detail) : undefined;

        const beginEvent: any = {
          cat: 'blink.user_timing',
          name,
          ph: 'b',
          pid: process.pid,
          tid: threadId,
          ts: startUs,
          id2,
          args: mergedDetail ? { detail: mergedDetail } : {},
        };

        const endEvent: any = {
          cat: 'blink.user_timing',
          name,
          ph: 'e',
          pid: process.pid,
          tid: threadId,
          ts: endUs,
          id2,
          args: {},
        };

        // Add link properties at top level if they exist
        if (id !== undefined) {
          beginEvent.id = id;
          endEvent.id = id;
        }
        if (parentId !== undefined) {
          beginEvent.parentId = parentId;
          endEvent.parentId = parentId;
        }
        if (flowIn !== undefined) {
          beginEvent.flowIn = flowIn;
          endEvent.flowIn = flowIn;
        }
        if (flowOut !== undefined) {
          beginEvent.flowOut = flowOut;
          endEvent.flowOut = flowOut;
        }

        this.#traceFile.write(beginEvent);
        this.#traceFile.write(endEvent);
      }
    }
  }

  span<T>(name: string, fn: () => T, options?: PerformanceMarkOptions): T {
    const startTime = performance.now();

    // Auto-detect context if detail is not provided in options
    const finalOptions: PerformanceMarkOptions | undefined =
      options?.detail === undefined
        ? { ...options, detail: getAutoDetectedDetail(this.#spansRegistry) }
        : options;

    try {
      return fn();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Create measure directly instead of using performance.measure
      const measure: PerformanceMeasure = {
        name,
        entryType: 'measure',
        startTime,
        duration,
        detail: finalOptions?.detail,
        toJSON: () => ({
          name,
          entryType: 'measure',
          startTime,
          duration,
          detail: finalOptions?.detail,
        }),
      };

      // Write directly to trace file
      if (this.#traceFile) {
        this.#traceFile.write(measure as ProfilingEvent);
      }
    }
  }

  instant(name: string, options?: PerformanceMarkOptions): void {
    // Auto-detect context if detail is not provided in options
    const finalOptions: PerformanceMarkOptions | undefined =
      options?.detail === undefined
        ? { ...options, detail: getAutoDetectedDetail(this.#spansRegistry) }
        : options;

    this.mark(name, finalOptions);

    // Automatically flush after instant mark to ensure data is captured
    if (this.#enabled && !this.#closed) {
      this.flush();
    }
  }

  #installExitHandlers(options: {
    envVar?: string;
    safeClose: (error?: unknown) => void;
  }): void {
    const { envVar = 'CP_PROFILING_EXIT_HANDLERS', safeClose } = options;
    installExitHandlers({
      envVar,
      safeClose: error => {
        if (error && (error as any).name === 'ExitHandlerError') {
          const kind = (error as any).message as
            | 'uncaughtException'
            | 'unhandledRejection';
          this.#writeFatalError(kind, error);
        }
        // Flush for exit handlers
        this.flush();
        safeClose(error);
      },
    });
  }

  // Private utility methods
  #handleError(operation: string, error: unknown): void {
    const profilerError = new ProfilerError(
      `Profiler operation '${operation}' failed`,
      operation,
      error,
    );
    console.warn(profilerError.message, { cause: error });
  }
}

export function createIncrementingId(start = 0): () => number {
  let i = start;
  return () => ++i;
}
