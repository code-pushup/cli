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
import { timingEventToTraceEvent } from './trace-events-helper';
import { type TraceFile, createTraceFile } from './trace-file-output';

type MarkOpts = MarkOptions & { detail?: unknown };

type FatalKind = 'uncaughtException' | 'unhandledRejection';

interface FatalError {
  type: 'fatal';
  pid: number;
  tid: number;
  tsMs: number;
  kind: FatalKind;
  error: unknown;
  details?: { name?: string; message?: string };
}

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

export function installExitHandlersOnce(opts: {
  onClose: () => void;
  onFatal?: (kind: FatalKind, error: unknown) => void;
}): void {
  const g = globalThis as any;
  if (g[EXIT_HANDLERS_INSTALLED]) return;
  g[EXIT_HANDLERS_INSTALLED] = true;

  const safe = (fn?: () => void) => {
    try {
      fn?.();
    } catch {}
  };
  const close = () => safe(opts.onClose);

  (['beforeExit', 'exit'] as const).forEach(ev => process.on(ev, close));

  SIGNALS.forEach(([sig, code]) =>
    process.on(sig, () => {
      close();
      process.exit(code);
    }),
  );

  process.on('uncaughtException', err => {
    safe(() => opts.onFatal?.('uncaughtException', err));
    close();
    throw err;
  });

  process.on('unhandledRejection', reason => {
    safe(() => opts.onFatal?.('unhandledRejection', reason));
    close();
  });
}

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

export function getFilenameParts<K extends string = never>(
  options: ProfilerOptions<K> = {},
): { filename: string; directory: string } {
  const directory =
    options.outDir ?? path.join(process.cwd(), PROFILER_OUT_DIR);
  const base = options.fileBaseName ?? PROFILER_FILE_BASE_NAME;
  const stamp =
    options.id ?? new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${base}.${stamp}`;
  return { filename, directory };
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
          for (const te of timingEventToTraceEvent(
            event,
            process.pid,
            threadId,
          )) {
            this.#traceFile!.write(te);
          }
        },
      });

      installExitHandlersOnce({
        onFatal: (kind, err) => this.#writeFatalError(kind, err),
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

  mark(name: string, options?: MarkOpts): PerformanceMark {
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
    a?: string | MeasureOptions,
    b?: string,
  ): PerformanceMeasure {
    return typeof a === 'string' || a === undefined
      ? performance.measure(name, a, b)
      : performance.measure(name, a);
  }

  flush(): void {
    this.#performanceObserver?.flush();
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
    this.#markWithDetail(start, options);
    try {
      return run();
    } finally {
      this.mark(end);
      this.measure(name, start, end);
      performance.clearMarks(start);
      performance.clearMarks(end);
    }
  }

  async spanAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?: MarkOpts,
  ): Promise<T> {
    return this.#withSpan(name, options, fn);
  }

  span<T>(name: string, fn: () => T, options?: MarkOpts): T {
    return this.#withSpan(name, options, fn);
  }

  instant(name: string, options?: MarkOpts): void {
    if (!this.#enabled) return;
    this.#markWithDetail(name, options);
  }

  #markWithDetail(name: string, options?: MarkOpts): void {
    const detail =
      options?.detail ?? getAutoDetectedDetail(this.#spansRegistry);
    this.mark(
      name,
      detail === undefined ? options : { ...(options ?? {}), detail },
    );
  }

  #writeFatalError(kind: FatalKind, error: unknown): void {
    if (this.#closed || !this.#traceFile) return;

    try {
      const fatal: FatalError = {
        type: 'fatal',
        pid: process.pid,
        tid: threadId,
        tsMs: performance.now(),
        kind,
        error,
        details: errorDetails(error),
      };
      this.#traceFile.write(fatal);
    } catch (e) {
      console.warn('Failed to write fatal error to trace file:', e);
    }
  }
}
