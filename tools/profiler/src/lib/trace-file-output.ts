import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { threadId } from 'node:worker_threads';
import { type FileOutput } from './file-output';
import { LineOutputError, createLineOutput } from './line-output';
import { DevToolsOutputFormat, type ProfilingEvent } from './output-format';
import {
  type TraceEvent,
  getTimingEventInstant,
  getTimingEventSpan,
} from './trace-events';

/**
 * Helper for MEASURE entries
 * - emits async begin/end (b/e)
 * - uses a simple incrementing id
 * - timestamps stay in ms
 */
export function measureToTraceEvents(
  entry: PerformanceMeasure,
  options: { pid: number; tid: number; nextId2: () => { local: string } },
): TraceEvent[] {
  return getTimingEventSpan({ entry, ...options });
}

/**
 * Helper for MARK entries
 * - emits an instant event (ph: i)
 * - timestamps stay in ms
 */
export function markToTraceEvent(
  entry: PerformanceMark,
  options: {
    pid: number;
    tid: number;
    nextId2?: () => { local: string };
    includeStack?: boolean;
  },
): TraceEvent {
  return getTimingEventInstant({
    entry,
    name: entry.name,
    ...options,
  });
}

/**
 * Generate the complete JSON structure for a Chrome DevTools trace file.
 */
function createTraceJsonOutput(traceEventsContent: string): string {
  return `{
  "metadata": {
    "dataOrigin": "TraceEvents",
    "hardwareConcurrency": 1,
    "source": "DevTools",
    "startTime": "recovered-${new Date().toISOString()}"
  },
  "traceEvents": [
${traceEventsContent}
  ]
}`;
}
/**
 * Trace file interface for Chrome DevTools trace event files.
 * Extends generic FileOutput with trace-specific features like recovery.
 */
type TraceFileEvent =
  | ProfilingEvent
  | {
      type: 'fatal';
      pid: number;
      tid: number;
      tsMs: number;
      kind: string;
      error: unknown;
    }
  | {
      type: 'error';
      pid: number;
      tid: number;
      tsMs: number;
      message: string;
      error: unknown;
    };

export interface TraceFile extends FileOutput<TraceFileEvent> {
  readonly jsonlPath: string;

  /**
   * Recover from incomplete or corrupted trace files.
   * Attempts to complete partial writes and convert to final format.
   */
  recover(): void;

  /**
   * Check if the file appears to be complete and valid.
   */
  isComplete(): boolean;
}

/**
 * Create a TraceFile instance for handling Chrome DevTools trace event files.
 * Uses DevTools trace format encoding with recovery capabilities.
 */
export function createTraceFile(opts: {
  filename: string;
  directory?: string;
  lineOutputExtension?: string;
  fileOutputExtension?: string;
  flushEveryN?: number;
  includeStackTraces?: boolean;
  parse?: (line: string) => unknown;
}): TraceFile {
  const directory = opts.directory || '';
  const lineOutputExtension = opts.lineOutputExtension || '.jsonl';
  const fileOutputExtension = opts.fileOutputExtension || '.json';
  const parser = opts.parse || ((line: string) => JSON.parse(line));

  const filePath = path.join(directory, opts.filename + fileOutputExtension);
  const jsonlPath = path.join(directory, opts.filename + lineOutputExtension);

  const outputFormat = new DevToolsOutputFormat(filePath, {
    includeStackTraces: opts.includeStackTraces,
  });

  let preambleWritten = false;
  let closed = false;

  const ensurePreambleWritten = () => {
    if (!preambleWritten) {
      preambleWritten = true;
      // Preamble is written during recovery, not here
    }
  };

  // Ensure directory exists for JSONL file
  const dir = path.dirname(jsonlPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Create line output with trace-specific parsing and encoding
  const lineOutput = createLineOutput<TraceFileEvent | string, unknown>({
    filePath: jsonlPath,
    flushEveryN: opts.flushEveryN,
    parse: (line: string) => JSON.parse(line), // Parse JSON lines
    encode: (obj: TraceFileEvent | string) => {
      if (typeof obj === 'string') return obj;

      // Check if this is a profiling event (mark or measure)
      if (
        'entryType' in obj &&
        (obj.entryType === 'mark' || obj.entryType === 'measure')
      ) {
        return outputFormat.encode(obj as ProfilingEvent, {
          pid: process.pid,
          tid: threadId,
          includeStackTraces: opts.includeStackTraces,
        });
      }

      // For fatal/error events, encode as JSON directly
      return JSON.stringify(obj);
    },
  });

  // Wrap line output in a simple file output interface
  const fileOutput = {
    filePath: jsonlPath,
    write: (obj: TraceFileEvent | string) => lineOutput.writeLine(obj),
    writeImmediate: (obj: TraceFileEvent | string) =>
      lineOutput.writeLineImmediate(obj),
    flush: () => lineOutput.flush(),
    close: () => lineOutput.close(),
  };

  return {
    ...fileOutput,
    jsonlPath,

    write(obj: TraceFileEvent): void {
      if (closed) return;
      fileOutput.write(obj);
    },

    writeImmediate(obj: TraceFileEvent): void {
      if (closed) return;
      ensurePreambleWritten();
      fileOutput.writeImmediate(obj);
    },

    close(): void {
      if (closed) return;
      closed = true;

      fileOutput.close();

      // Convert JSONL to final format (includes epilogue)
      try {
        this.recover();
      } catch (error) {
        console.error('Error during file recovery on close:', error);
      }
    },

    recover(): void {
      try {
        // Ensure directory exists for final file
        const dir = path.dirname(filePath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        // Check if JSONL file exists and has content
        if (!existsSync(jsonlPath)) {
          // No content to recover, write empty trace
          const emptyOutput = createTraceJsonOutput('');
          writeFileSync(filePath, emptyOutput, 'utf8');
          return;
        }

        // Parse JSONL and extract valid content with first/last events
        const { skippedLines } = lineOutput.recover();
        const validJsonl = readFileSync(jsonlPath, 'utf8');

        // Handle empty case (though this shouldn't happen due to trim check above)
        if (!validJsonl.trim()) {
          const emptyOutput = `{
  "metadata": {
    "dataOrigin": "TraceEvents",
    "hardwareConcurrency": 1,
    "source": "DevTools",
    "startTime": "recovered-${new Date().toISOString()}"
  },
  "traceEvents": []
}`;
          writeFileSync(filePath, emptyOutput, 'utf8');
          return;
        }

        const earliestTs = 0;
        const latestTs = 0;

        // Determine prolog timestamp
        let prologTs = Math.max(0, earliestTs - 20);

        // If jsonl file exists and was created after first entry, use first entry time
        if (existsSync(jsonlPath)) {
          try {
            const jsonlStats = statSync(jsonlPath);
            const jsonlCreationTime = jsonlStats.birthtime.getTime() * 1000; // Convert to microseconds
            if (jsonlCreationTime > earliestTs) {
              prologTs = earliestTs;
            }
          } catch {
            // If we can't get file stats, fall back to default logic
          }
        }

        const prologEvents = outputFormat.preamble({
          pid: process.pid,
          tid: threadId,
          url: filePath,
          traceStartTs: prologTs,
        });

        // Add epilog events (after latest performance event)
        const epilogEvents = outputFormat.epilogue({
          pid: process.pid,
          tid: threadId,
        });

        // Adjust epilog timestamps to be after the latest event
        const adjustedEpilogEvents = epilogEvents.map(eventStr => {
          try {
            const event = JSON.parse(eventStr);
            if (event.ts && event.ts < latestTs) {
              event.ts = latestTs + 10; // Place 10 units after the last perf event
            }
            return JSON.stringify(event);
          } catch {
            return eventStr;
          }
        });

        // Build trace events content
        let traceEventsContent = '';

        // Add prolog events
        if (prologEvents.length > 0) {
          traceEventsContent +=
            prologEvents.map(event => `      ${event}`).join(',\n') + ',\n';
        }

        // Add valid JSONL
        if (validJsonl) {
          const trimmedJsonl = validJsonl.trim();
          if (trimmedJsonl) {
            traceEventsContent +=
              '      ' + trimmedJsonl.replace(/\n/g, ',\n      ');
            if (adjustedEpilogEvents.length > 0) {
              traceEventsContent += ',\n';
            } else {
              traceEventsContent += '\n';
            }
          }
        }

        // Add epilog events
        if (adjustedEpilogEvents.length > 0) {
          for (let i = 0; i < adjustedEpilogEvents.length; i++) {
            traceEventsContent += `      ${adjustedEpilogEvents[i]}`;
            if (i < adjustedEpilogEvents.length - 1) {
              traceEventsContent += ',\n';
            }
          }
        }

        // Write complete JSON structure
        const jsonOutput = createTraceJsonOutput(traceEventsContent);

        writeFileSync(filePath, jsonOutput, 'utf8');

        // Validate that the final JSON file is parseable
        try {
          JSON.parse(jsonOutput);
        } catch (parseError) {
          throw new LineOutputError(
            `Recovery produced invalid JSON in file "${filePath}"`,
            parseError as Error,
          );
        }
      } catch (error) {
        throw new LineOutputError(
          `Failed to recover trace file "${filePath}"`,
          error as Error,
        );
      }
    },

    isComplete(): boolean {
      if (!existsSync(filePath)) return false;

      try {
        const content = readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);

        // Check basic structure
        if (!parsed.metadata || !Array.isArray(parsed.traceEvents)) {
          return false;
        }

        // Check for epilogue events (RunTask events)
        const hasEpilogue = parsed.traceEvents.some(
          (event: any) => event.name === 'RunTask',
        );

        return hasEpilogue;
      } catch {
        return false;
      }
    },
  };
}
