import { createReadStream, createWriteStream } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { threadId } from 'node:worker_threads';
import type { DevtoolsSpansRegistry } from '@code-pushup/profiler';
import {
  getRunTaskTraceEvent,
  getStartTracing,
  markToTraceEvent,
  measureToTraceEvents,
} from './trace-events';

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

/**
 * OutputFormat defines how to encode profiling events into output format.
 * Responsibilities:
 * - Define output schema and semantics
 * - Own all format-specific concepts (pid, tid, timestamps, url)
 * - Support multiple formats/versions
 */
export interface OutputFormat<I = unknown> {
  readonly id: string;
  readonly filePath: string;

  /**
   * Return preamble events written at the start of tracing.
   */
  preamble(opt?: Record<string, unknown>): string[];

  encode(event: I, opt?: Record<string, unknown>): string[];

  epilogue(opt?: Record<string, unknown>): string[];

  finalize?(): void | Promise<void>;
}

export type ProfilingEvent =
  | ExtendedPerformanceMark
  | ExtendedPerformanceMeasure;
/**
 * Chrome DevTools output format implementation.
 */
export class DevToolsOutputFormat implements OutputFormat<ProfilingEvent> {
  readonly id = 'devtools';
  readonly fileExt = 'jsonl';
  readonly filePath: string;

  #nextId2 = (() => {
    let id = 0;
    return () => ({ local: `0x${(++id).toString(16).toUpperCase()}` });
  })();

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  preamble(opt?: { pid: number; tid: number; url: string }): string[] {
    const traceStartTs = Math.round(performance.now() * 1000);
    const pid = opt?.pid ?? process.pid;
    const tid = opt?.tid ?? threadId;
    const url = opt?.url ?? this.filePath;
    return [
      JSON.stringify(
        getStartTracing(pid, tid, {
          traceStartTs,
          url,
        }),
      ),
      JSON.stringify(
        getRunTaskTraceEvent(pid, tid, {
          ts: traceStartTs,
          dur: 10,
        }),
      ),
    ];
  }

  encode(event: ProfilingEvent, opt?: { pid: number; tid: number }): string[] {
    const ctx = {
      pid: opt?.pid ?? process.pid,
      tid: opt?.tid ?? threadId,
      nextId2: this.#nextId2,
    };

    switch (event.entryType) {
      case 'mark':
        return [JSON.stringify(markToTraceEvent(event, ctx))];
      case 'measure':
        return measureToTraceEvents(event, ctx).map(event =>
          JSON.stringify(event),
        );
      default:
        return [];
    }
  }

  epilogue(opt?: { pid: number; tid: number }): string[] {
    const pid = opt?.pid ?? process.pid;
    const tid = opt?.tid ?? threadId;
    return [
      JSON.stringify(
        getRunTaskTraceEvent(pid, tid, {
          ts: Math.round(performance.now() * 1000),
          dur: 10,
        }),
      ),
    ];
  }

  async finalize(): Promise<void> {
    try {
      const transformStream = new Transform({
        objectMode: false,
        transform(chunk, encoding, callback) {
          const data = chunk.toString();
          // Split into lines and process each line
          const lines = data.split('\n').filter((line: string) => line.trim());
          if (lines.length > 0) {
            // Add comma after each line except the last one in the chunk
            const processedLines = lines.map((line: string, index: number) =>
              index < lines.length - 1 ? `${line},\n` : `${line}\n`,
            );
            this.push(processedLines.join(''));
          }
          callback();
        },
        flush(callback) {
          // Close the JSON array and object
          this.push('\n    ]\n}');
          callback();
        },
      });

      // Write the JSON opening structure
      const writeStream = createWriteStream(this.filePath);
      writeStream.write(`{
    "metadata": {
      "dataOrigin": "TraceEvents",
      "hardwareConcurrency": 1,
      "source": "DevTools",
      "startTime": "mocked-timestamp"
    },
    "traceEvents": [
`);

      await pipeline(
        createReadStream(this.filePath, { encoding: 'utf8' }),
        transformStream,
        writeStream,
      );
    } catch (error) {
      throw new Error(`Failed to wrap trace JSON file: ${this.filePath}`);
    }
  }
}
