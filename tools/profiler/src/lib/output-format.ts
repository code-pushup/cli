import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
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
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Read existing JSONL content if file exists
      let jsonlContent = '';
      if (existsSync(this.filePath)) {
        jsonlContent = readFileSync(this.filePath, 'utf8');
      }

      // Transform JSONL to JSON array format
      const lines = jsonlContent
        .split('\n')
        .filter((line: string) => line.trim());
      const traceEventsContent =
        lines.length > 0
          ? lines
              .map((line: string, index: number) =>
                index < lines.length - 1 ? `      ${line},` : `      ${line}`,
              )
              .join('\n')
          : '';

      // Write complete JSON structure
      const jsonOutput = `{
    "metadata": {
      "dataOrigin": "TraceEvents",
      "hardwareConcurrency": 1,
      "source": "DevTools",
      "startTime": "mocked-timestamp"
    },
    "traceEvents": [
${traceEventsContent}
    ]
}`;

      writeFileSync(this.filePath, jsonOutput, 'utf8');
    } catch (error) {
      throw new Error(`Failed to wrap trace JSON file: ${this.filePath}`);
    }
  }
}
