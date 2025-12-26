/* eslint-disable no-console, @typescript-eslint/class-methods-use-this */
import path from 'node:path';
import { PerformanceObserver, performance } from 'node:perf_hooks';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import { type MeasureOptions } from 'perf_hooks';
import {
  DevToolsOutputFormat,
  type ExtendedPerformanceMeasure,
  type OutputFormat,
  type ProfilingEvent,
  getAutoDetectedDetail,
} from './output-format';
import { type ProcessOutput, createProcessOutput } from './process-output';
import {
  type DevtoolsSpanConfig,
  type DevtoolsSpanHelpers,
  type DevtoolsSpansRegistry,
  createDevtoolsSpans,
} from './span-helpers';
import { installExitHandlers } from './utils';

const nextId = createIncrementingId();
const id = nextId();

export type ProfilerOptions<K extends string = never> = {
  enabled?: boolean;
  outDir?: string;
  fileBaseName?: string;
  /** write metadata line once at start */
  metadata?: Record<string, unknown>;

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

  #output: ProcessOutput | undefined;
  #outPath: string;
  #outputFileFinal: string;
  #outputFormat: OutputFormat;
  #closed = false;

  readonly #spans: DevtoolsSpanHelpers<DevtoolsSpansRegistry<K | 'main'>>;
  readonly #spansRegistry: DevtoolsSpansRegistry<K | 'main'>;

  constructor(options: ProfilerOptions<K> = {}) {
    this.enableProfiling(
      options.enabled ?? process.env[PROFILER_ENV_VAR] !== 'false',
    );

    const outDir = options.outDir ?? path.join(process.cwd(), PROFILER_OUT_DIR);
    const base = options.fileBaseName ?? 'timing.profile';
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${base}.${timestamp}`;

    this.#outPath = path.resolve(outDir, `${fileName}.jsonl`);
    this.#outputFileFinal = path.resolve(outDir, `${fileName}.json`);

    const registry = {
      ...(options.spans ?? {}),
      main: DEFAULT_MAIN_SPAN,
    } as DevtoolsSpansRegistry<K | 'main'>;

    this.#spansRegistry = registry;
    this.#spans = createDevtoolsSpans(registry);
    this.#outputFormat = new DevToolsOutputFormat(this.#outputFileFinal);

    if (!this.#enabled) return;

    try {
      this.#output = createProcessOutput({ filePath: this.#outPath });

      const preambleOpts = {
        pid: process.pid,
        tid: threadId,
        url: this.#outputFileFinal,
      };

      this.#writeLineImmediate(this.#outputFormat.preamble(preambleOpts));
      const preambleEvents = this.#outputFormat.preamble(preambleOpts);
      for (const event of preambleEvents) {
        this.#output.writeLineImmediate(event);
      }

      this.#installPerformanceObserver({ buffer: true });

      this.#installExitHandlers({
        envVar: 'CP_PROFILING_EXIT_HANDLERS',
        safeClose: err => {
          if (err) {
            this.#output?.writeLine({
              type: 'error',
              pid: process.pid,
              tid: threadId,
              tsMs: performance.now(),
              message: err instanceof Error ? err.message : String(err),
              error: err,
            });
          }
          this.close();
        },
      });
    } catch {
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

  #writeLineImmediate(entries: string[]): void {
    if (this.#output != null) {
      const writeLineImmediate = this.#output.writeLineImmediate;
      const e = entries instanceof Array ? entries : [entries];
      const encodeOpts = {
        pid: process.pid,
        tid: threadId,
      };
      e.forEach(entry =>
        this.#outputFormat
          .encode(entry, encodeOpts)
          .forEach(writeLineImmediate),
      );
    }
  }

  #writeFatalError(
    kind: 'uncaughtException' | 'unhandledRejection',
    error: unknown,
  ): void {
    if (!this.#enabled || this.#closed || !this.#output) return;

    try {
      this.#output.writeLine({
        type: 'fatal',
        pid: process.pid,
        tid: threadId,
        tsMs: performance.now(),
        kind,
        error:
          kind === 'uncaughtException'
            ? {
                name: (error as any)?.name,
                message: (error as any)?.message,
                stack: (error as any)?.stack,
              }
            : error,
      });
    } catch {
      // ignore
    }
  }

  #writeEntry(entries: ProfilingEvent | ProfilingEvent[]): void {
    if (this.#output != null) {
      const writeLineImmediate = this.#output.writeLineImmediate;
      const e = entries instanceof Array ? entries : [entries];
      const encodeOpts = {
        pid: process.pid,
        tid: threadId,
      };
      e.forEach(entry =>
        this.#outputFormat
          .encode(entry, encodeOpts)
          .forEach(writeLineImmediate),
      );
    }
  }

  #installPerformanceObserver(options: { buffer?: boolean }): void {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      if (this.#enabled && !this.#closed && this.#output) {
        for (const entry of entries) {
          this.#writeEntry(entry as any);
        }
      }
    });

    observer.observe({
      entryTypes: ['mark', 'measure'],
      buffered: options.buffer ?? false,
    });
  }

  enableProfiling(isEnabled: boolean): void {
    process.env[this.#envEnabled] = `${isEnabled}`;
    this.#enabled = isEnabled;
  }

  mark(name: string, detail?: unknown) {
    const options: PerformanceMarkOptions | undefined =
      detail === undefined ? undefined : { detail };
    return performance.mark(name, options);
  }

  measure(name: string, options: string | MeasureOptions) {
    return performance.measure(name, options as MeasureOptions);
  }

  flush(): void {
    if (!this.#enabled || this.#closed || !this.#output) return;
    this.#output.flush();
  }

  close(): void {
    if (!this.#enabled || this.#closed) return;
    this.#closed = true;

    if (!this.#output) return;

    try {
      this.flush();
      this.#writeLineImmediate(this.#outputFormat.preamble());
      this.#output.flush();
    } catch {
      // ignore
    }

    // Close output and finalize format
    try {
      this.#output.close();
    } catch {
      // ignore
    }

    try {
      this.#outputFormat.finalize?.();
    } catch {
      // ignore
    }

    this.#output = undefined;
  }

  async span<T>(
    name: string,
    fn: () => Promise<T>,
    options?: PerformanceMarkOptions,
  ): Promise<T> {
    if (!this.#enabled || this.#closed) {
      return fn();
    }

    const start = `${name}:start`;
    const end = `${name}:end`;

    // Auto-detect context if detail is not provided in options
    const finalOptions: PerformanceMarkOptions | undefined =
      options?.detail === undefined
        ? { ...options, detail: getAutoDetectedDetail(this.#spansRegistry) }
        : options;

    this.mark(start, finalOptions);

    try {
      return await fn();
    } finally {
      this.mark(end);
      this.measure(name, { start, end, detail: finalOptions?.detail });
    }
  }

  wrap<T>(name: string, fn: () => T, options?: PerformanceMarkOptions): T {
    if (!this.#enabled || this.#closed) {
      return fn();
    }

    const start = `${name}:start`;
    const end = `${name}:end`;

    // Auto-detect context if detail is not provided in options
    const finalOptions: PerformanceMarkOptions | undefined =
      options?.detail === undefined
        ? { ...options, detail: getAutoDetectedDetail(this.#spansRegistry) }
        : options;

    this.mark(start, finalOptions);
    try {
      return fn();
    } finally {
      this.mark(end);
      this.measure(name, { start, end, detail: finalOptions?.detail });
    }
  }

  instant(name: string, options?: PerformanceMarkOptions): void {
    if (!this.#enabled || this.#closed) return;

    // Auto-detect context if detail is not provided in options
    const finalOptions: PerformanceMarkOptions | undefined =
      options?.detail === undefined
        ? { ...options, detail: getAutoDetectedDetail(this.#spansRegistry) }
        : options;

    this.mark(name, finalOptions);
  }

  #installExitHandlers(options: {
    envVar?: string;
    safeClose: (error?: unknown) => void;
  }): void {
    const { envVar = 'CP_PROFILING_EXIT_HANDLERS', safeClose } = options;
    installExitHandlers({
      envVar,
      safeClose: error => {
        // Log fatal errors if this is an ExitHandlerError
        if (error && (error as any).name === 'ExitHandlerError') {
          const kind = (error as any).message as
            | 'uncaughtException'
            | 'unhandledRejection';
          this.#writeFatalError(kind, error);
        }
        this.close();
        safeClose(error);
      },
    });
  }
}

export function createIncrementingId(start = 0): () => number {
  let i = start;
  return () => ++i;
}
