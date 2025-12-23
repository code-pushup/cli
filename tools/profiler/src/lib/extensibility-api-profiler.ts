/* eslint-disable no-console, @typescript-eslint/class-methods-use-this */
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import {
  createDevtoolsSpans,
  markToTraceEvent,
  measureToTraceEvents,
} from './utils';

export type DevToolsColor =
  | 'primary'
  | 'primary-light'
  | 'primary-dark'
  | 'secondary'
  | 'secondary-light'
  | 'secondary-dark'
  | 'tertiary'
  | 'tertiary-light'
  | 'tertiary-dark'
  | 'error';

export interface ExtensionTrackEntryPayload {
  dataType?: 'track-entry'; // Defaults to "track-entry"
  color?: DevToolsColor; // Defaults to "primary"
  track: string; // Required: Name of the custom track
  trackGroup?: string; // Optional: Group for organizing tracks
  properties?: [string, string][]; // Key-value pairs for detailed view
  tooltipText?: string; // Short description for tooltip
}

export interface ExtensionMarkerPayload {
  dataType: 'marker'; // Required: Identifies as a marker
  color?: DevToolsColor; // Defaults to "primary"
  properties?: [string, string][]; // Key-value pairs for detailed view
  tooltipText?: string; // Short description for tooltip
}

export interface Details<
  T = ExtensionTrackEntryPayload | ExtensionMarkerPayload,
> {
  devtools: T;
}

export type ExtendedPerformanceMark = PerformanceMark & {
  detail?: Details<ExtensionMarkerPayload>;
};

export type ExtendedPerformanceMeasure = PerformanceMeasure & {
  detail?: Details<PerformanceMeasure>;
};

export type ProfilerOptions = {
  enabled?: boolean;
  outDir?: string;
  fileBaseName?: string;
  /** write metadata line once at start */
  metadata?: Record<string, unknown>;
  /** install exit handlers to close file */
  installExitHandlers?: boolean;
  tracks?: Record<string, unknown>;
};

const t = createDevtoolsSpans({
  cli: { track: 'Analysis', group: 'Tools', color: 'primary' },
  plugins: { track: 'I/O', group: 'Tools', color: 'secondary' },
} as const);

export const DEFAULT_PROFILER_OUT_DIR = path.join('tmp', 'profiles');

const nextId = createIncrementingId();

export class Profiler {
  readonly #enabled: boolean;
  readonly #filePath: string;
  // this property is undefined if fs.openSync was not used
  #fd: number | undefined;
  #closed = false;

  constructor(options: ProfilerOptions = {}) {
    this.#enabled = options.enabled ?? true;

    const outDir =
      options.outDir ?? path.join(process.cwd(), DEFAULT_PROFILER_OUT_DIR);
    const base = options.fileBaseName ?? 'timing-marker';
    const fileName = `${base}.pid-${process.pid}.jsonl`;
    this.#filePath = path.resolve(outDir, fileName);

    if (!this.#enabled) return;
    console.log('Profiler enabled:', {
      filePath: this.#filePath,
    });
    fs.mkdirSync(path.dirname(this.#filePath), { recursive: true });
    this.#fd = fs.openSync(this.#filePath, 'a');

    if (options.metadata) {
      this.#writeLine({
        type: 'meta',
        pid: process.pid,
        tid: threadId,
        tsMs: performance.now(),
        ...options.metadata,
      });
    }

    if (options.installExitHandlers ?? true) {
      this.#installExitHandlers();
    }
  }

  get filePath(): string {
    return this.#filePath;
  }

  /**
   * Create a mark via perf_hooks (so Node keeps its semantics).
   * Assumes your monkey patch is loaded before, so the hook sees the entry.
   */
  mark(
    name: string,
    detail?: unknown,
  ): PerformanceMark | ExtendedPerformanceMark | undefined {
    if (!this.#enabled || this.#closed) return;

    // Prefer standards-style options so "detail" is attached to the entry (where supported).
    const options: PerformanceMarkOptions | undefined =
      detail === undefined ? undefined : { detail };

    const entry = performance.mark(name, options) as ExtendedPerformanceMark;

    if (entry) {
      this.#writeLine(
        markToTraceEvent(entry, {
          pid: process.pid,
          tid: threadId,
        }),
      );
    }

    return entry;
  }

  /**
   * Create a measure via perf_hooks.
   * start/end follow the web-ish perf_hooks options contract:
   * - number: timestamp in ms (same time origin as performance.now())
   * - string: mark name
   */
  measure(
    name: string,
    detail?: unknown,
  ): PerformanceMeasure | ExtendedPerformanceMeasure | undefined {
    if (!this.#enabled || this.#closed) return;

    const entry = performance.measure(name, {
      detail,
    }) as PerformanceMeasure;

    if (entry) {
      this.#writeLine(
        measureToTraceEvents(entry, {
          pid: process.pid,
          tid: threadId,
          nextId,
        }),
      );
    }
    return entry;
  }

  flush(): void {
    if (!this.#enabled || this.#closed) return;
    if (this.#fd != null) {
      try {
        fs.fsyncSync(this.#fd);
      } catch {
        // ignore
      }
    }
  }

  close(): void {
    if (!this.#enabled || this.#closed) return;
    this.#closed = true;

    try {
      this.flush();
    } catch {
      // ignore
    }

    if (this.#fd != null) {
      try {
        fs.closeSync(this.#fd);
      } catch {
        // ignore
      }
      this.#fd = undefined;
    }
  }

  // ------------------------

  #writeLine(obj: unknown): void {
    const line = JSON.stringify(obj) + '\n';
    if (this.#fd != null) {
      fs.writeSync(this.#fd, line, undefined, 'utf8');
    } else {
      fs.appendFileSync(this.#filePath, line, 'utf8');
    }
  }

  #installExitHandlers(): void {
    const safeClose = () => {
      try {
        this.close();
      } catch {
        // ignore
      }
    };

    process.on('beforeExit', safeClose);
    process.on('exit', safeClose);
    process.on('SIGINT', () => {
      safeClose();
      process.exit(130);
    });
    process.on('SIGTERM', () => {
      safeClose();
      process.exit(143);
    });

    process.on('uncaughtException', err => {
      try {
        this.#writeLine({
          type: 'fatal',
          pid: process.pid,
          tid: threadId,
          tsMs: performance.now(),
          kind: 'uncaughtException',
          error: {
            name: (err as any)?.name,
            message: (err as any)?.message,
            stack: (err as any)?.stack,
          },
        });
      } catch {
        // ignore
      }
      safeClose();
      throw err;
    });

    process.on('unhandledRejection', reason => {
      try {
        this.#writeLine({
          type: 'fatal',
          pid: process.pid,
          tid: threadId,
          tsMs: performance.now(),
          kind: 'unhandledRejection',
          error: reason,
        });
      } catch {
        // ignore
      }
      safeClose();
    });
  }
}

// ---- helpers ----

function newestByName(
  name: string,
  type: 'mark' | 'measure',
): PerformanceEntry | undefined {
  const list = performance.getEntriesByName(String(name), type);
  return list.length ? list[list.length - 1] : undefined;
}

/** Tiny helper for simple incremental ids */
export function createIncrementingId(start = 0): () => number {
  let i = start;
  return () => ++i;
}
