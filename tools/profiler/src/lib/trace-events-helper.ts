import { performance } from 'node:perf_hooks';
import type {
  CompleteEvent,
  InstantEvent,
  SpanEvent,
  TraceEvent,
} from './trace-events.types';
import {
  type ExtendedPerformanceMark,
  type ExtendedPerformanceMeasure,
} from './trace-file-output';

export function getTimingEventInstant(options: {
  entry?: PerformanceMark;
  name: string;
  ts?: number;
  timeOrigin?: number;
  detail?: any;
  pid: number;
  tid: number;
  nextId2?: () => { local: string }; // Optional since not used for instant events
  includeStack?: boolean;
}): InstantEvent {
  // {"args":{"data":{"callTime":37300251007,"detail":"{\"name\":\"invoke-has-pre-registration-flag\",\"componentName\":\"messaging\",\"spanId\":3168785428,\"traceId\":613107129,\"error\":false}","navigationId":"234F7482B1E9D4B1EEA32305D6FBF815","sampleTraceId":8589113407370704,"startTime":229}},"cat":"blink.user_timing","name":"start-invoke-has-pre-registration-flag","ph":"I","pid":31825,"s":"t","tid":1197643,"ts":37300250992,"tts":179196},
  const { pid, tid, nextId2, entry, name, ts, detail, includeStack } = options;

  // Determine timestamp: use provided ts, or calculate from entry if available
  // Use absolute timestamps for cross-process alignment (Strategy B)
  // Apply offset to timeOrigin to match Chrome trace timestamp format
  const timeOriginBase = 1766930000000; // Base to align with Chrome trace format
  const effectiveTimeOrigin = performance.timeOrigin - timeOriginBase;
  const timestamp =
    ts ??
    (entry
      ? Math.round((effectiveTimeOrigin + entry.startTime) * 1000)
      : Math.round((effectiveTimeOrigin + performance.now()) * 1000));

  // Merge details: entry detail + provided detail
  const mergedDetail =
    entry?.detail || detail
      ? Object.assign({}, entry?.detail, detail)
      : undefined;

  const traceEvent: InstantEvent = {
    cat: 'blink.user_timing',
    name: name,
    ph: 'I', // Uppercase I for instant events in Chrome DevTools format
    s: 't', // Timeline scope
    pid,
    tid,
    ts: timestamp,
    tts: timestamp, // Thread timestamp (same as main timestamp for instant events)
    args: {
      data: {
        ...(mergedDetail && { detail: JSON.stringify(mergedDetail) }),
        startTime: entry?.startTime || 0,
      },
    },
    // Note: id2 is not used for instant events in Chrome DevTools format
  };

  // Add stack trace if requested
  if (includeStack) {
    traceEvent.stack = captureStackTrace().join('\n');
  }

  return traceEvent;
}

export function getTimingEventSpan(options: {
  entry: PerformanceMeasure;
  name?: string;
  detail?: any;
  pid: number;
  tid: number;
  nextId2: () => { local: string };
}): [SpanEvent, SpanEvent] {
  const { pid, tid, nextId2, entry, name: explicitName, detail } = options;

  const eventName = explicitName ?? entry.name;
  const timeOriginBase = 1766930000000; // Base to align with Chrome trace format
  const effectiveTimeOrigin = performance.timeOrigin - timeOriginBase;
  const startUs = Math.round((effectiveTimeOrigin + entry.startTime) * 1000);
  const endUs = Math.round(
    (effectiveTimeOrigin + entry.startTime + entry.duration) * 1000,
  );

  const mergedDetail =
    entry?.detail || detail
      ? Object.assign({}, entry?.detail, detail)
      : undefined;

  const id2 = nextId2();

  const begin: SpanEvent = {
    cat: 'blink.user_timing',
    name: eventName,
    ph: 'b',
    pid,
    tid,
    ts: startUs,
    id2,
    args: mergedDetail ? { detail: JSON.stringify(mergedDetail) } : {},
  };

  const end: SpanEvent = {
    cat: 'blink.user_timing',
    name: eventName,
    ph: 'e',
    pid,
    tid,
    ts: endUs,
    id2,
    args: {},
  };

  return [begin, end];
}

export function getFrameTreeNodeId(pid: number, tid: number): number {
  return Number.parseInt(`${pid}0${tid}`);
}

export function getFrameName(pid: number, tid: number): string {
  return `FRAME0P${pid}T${tid}`;
}

export function getStartTracing(
  pid: number,
  tid: number,
  opt: {
    traceStartTs: number;
    url: string;
  },
): InstantEvent {
  const { traceStartTs, url } = opt;
  const frameTreeNodeId = getFrameTreeNodeId(pid, tid);
  return {
    cat: 'devtools.timeline',
    name: 'TracingStartedInBrowser',
    ph: 'i',
    pid,
    tid,
    ts: traceStartTs,
    s: 't',
    tts: traceStartTs, // Thread timestamp for instant event
    args: {
      data: {
        frameTreeNodeId,
        frames: [
          {
            frame: getFrameName(pid, tid),
            isInPrimaryMainFrame: true,
            isOutermostMainFrame: true,
            name: '',
            processId: pid,
            url,
          },
        ],
        persistentIds: true,
      },
    },
  } as InstantEvent;
}

export function getRunTaskTraceEvent(
  pid: number,
  tid: number,
  opt: {
    ts: number;
    dur: number;
  },
): CompleteEvent {
  const { ts, dur } = opt;
  return {
    args: {},
    cat: 'devtools.timeline',
    dur,
    name: 'RunTask',
    ph: 'X',
    pid,
    tid,
    ts,
  } as CompleteEvent;
}

/**
 * Captures the current call stack and returns it as an array of strings.
 * The stack is ordered with the rootmost frame (e.g., global scope) at index 0
 * and the leafmost frame (where the event occurred) as the last item.
 * @returns Array of stack frame strings, or empty array if stack capture fails
 */
export function captureStackTrace(): string[] {
  try {
    // Create an Error object to capture the stack trace
    const rawStack = new Error().stack || '';

    // Split by newlines and clean up the stack
    const stackLines = rawStack
      .split('\n')
      .slice(1) // Remove the "Error" header line
      .map(line => line.trim())
      .filter(line => line.length > 0); // Remove empty lines

    // Reverse the stack so root is at index 0 and leaf is at the end
    // This matches the Trace Event Format specification
    return stackLines.reverse();
  } catch (error) {
    // If stack capture fails, return empty array
    return [];
  }
}
