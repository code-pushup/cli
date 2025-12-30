import { performance } from 'node:perf_hooks';
import type {
  CompleteEvent,
  InstantEvent,
  SpanEvent,
} from './trace-events.types';
import { markToTraceEvent, measureToTraceEvents } from './trace-file-output';

/**
 * Converts a performance timestamp to Chrome trace format timestamp in microseconds.
 *
 * The formula works as follows:
 * 1. `performance.timeOrigin` is the time when the performance timeline started (in milliseconds since Unix epoch)
 * 2. Subtract a base offset (1766930000000) to align with Chrome's trace format expectations
 * 3. Add the relative timestamp (e.g., `performance.now()` or `entry.startTime`) to get absolute time
 * 4. Multiply by 1000 to convert from milliseconds to microseconds (Chrome trace format uses microseconds)
 * 5. Round to nearest integer for precision
 *
 * @param ts - Optional pre-calculated timestamp in microseconds (if provided, skips calculation)
 * @param relativeTime - Relative time in milliseconds (defaults to performance.now())
 * @returns Timestamp in microseconds, aligned with Chrome trace format
 */
function toChromeTraceTimestamp(
  ts?: number,
  relativeTime = performance.now(),
): number {
  if (ts != null) {
    return ts;
  }

  const timeOriginBase = 1766930000000; // Base to align with Chrome trace format
  const effectiveTimeOrigin = performance.timeOrigin - timeOriginBase;
  return Math.round((effectiveTimeOrigin + relativeTime) * 1000);
}

const nextId2 = (() => {
  let counter = 1;
  return () => ({ local: `0x${counter++}` });
})();

export function getTimingEventInstant(options: {
  entry?: PerformanceMark;
  name: string;
  ts?: number;
  timeOrigin?: number;
  detail?: any;
  pid: number;
  tid: number;
  nextId2?: () => { local: string }; // Optional since not used for instant events
}): InstantEvent {
  // {"args":{"data":{"callTime":37300251007,"detail":"{\"name\":\"invoke-has-pre-registration-flag\",\"componentName\":\"messaging\",\"spanId\":3168785428,\"traceId\":613107129,\"error\":false}","navigationId":"234F7482B1E9D4B1EEA32305D6FBF815","sampleTraceId":8589113407370704,"startTime":229}},"cat":"blink.user_timing","name":"start-invoke-has-pre-registration-flag","ph":"I","pid":31825,"s":"t","tid":1197643,"ts":37300250992,"tts":179196},
  const { pid, tid, nextId2, entry, name, ts, detail } = options;

  // Determine timestamp: use provided ts, or calculate from entry if available
  // Use absolute timestamps for cross-process alignment (Strategy B)
  const timestamp = entry
    ? toChromeTraceTimestamp(ts, entry.startTime)
    : toChromeTraceTimestamp(ts);

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
    args: {
      data: {
        ...(mergedDetail && { detail: JSON.stringify(mergedDetail) }),
        startTime: entry?.startTime || 0,
      },
    },
  };

  return traceEvent;
}

export function getTimingEventSpan(options: {
  entry: PerformanceMeasure;
  name?: string;
  detail?: any;
  pid: number;
  tid: number;
}): [SpanEvent, SpanEvent] {
  const { pid, tid, entry, name: explicitName, detail } = options;

  const eventName = explicitName ?? entry.name;
  const startUs = toChromeTraceTimestamp(undefined, entry.startTime);
  const endUs = toChromeTraceTimestamp(
    undefined,
    entry.startTime + entry.duration,
  );

  // For measures, try to get detail from the corresponding start mark
  let measureDetail = entry?.detail || detail;
  if (!measureDetail && eventName) {
    const startMarkName = `${eventName}:start`;
    const startMark = performance.getEntriesByName(
      startMarkName,
      'mark',
    )[0] as PerformanceMark;
    if (startMark?.detail) {
      measureDetail = startMark.detail;
    }
  }

  const mergedDetail = measureDetail
    ? Object.assign({}, measureDetail)
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

// Flow event generators for causality tracking
export function getTimingEventFlowStart(options: {
  name: string;
  id: string;
  pid: number;
  tid: number;
  ts?: number;
  bp?: 'e' | 's';
  detail?: any;
}): import('./trace-events.types').FlowStartEvent {
  const { name, id, pid, tid, ts, bp, detail } = options;

  const timestamp = toChromeTraceTimestamp(ts);

  const event: import('./trace-events.types').FlowStartEvent = {
    cat: 'blink.user_timing',
    name,
    ph: 's',
    id,
    pid,
    tid,
    ts: timestamp,
    args: detail ? { detail: JSON.stringify(detail) } : {},
  };

  if (bp) {
    event.bp = bp;
  }

  return event;
}
export function getTimingEventFlowEnd(options: {
  name: string;
  id: string;
  pid: number;
  tid: number;
  ts?: number;
  bp?: 'e' | 's';
  detail?: any;
}): import('./trace-events.types').FlowEndEvent {
  const { name, id, pid, tid, ts, bp, detail } = options;

  const timestamp = toChromeTraceTimestamp(ts);

  const event: import('./trace-events.types').FlowEndEvent = {
    cat: 'blink.user_timing',
    name,
    ph: 'f',
    id,
    pid,
    tid,
    ts: timestamp,
    args: detail ? { detail: JSON.stringify(detail) } : {},
  };

  if (bp) {
    event.bp = bp;
  }

  return event;
}

/**
 * Convert a ProfilingEvent (mark or measure) to TraceEvent(s)
 */
export function timingEventToTraceEvent(
  event: import('./trace-file-output').ProfilingEvent,
  pid: number,
  tid: number,
  measureDetails?: Map<string, any>,
  markDetails?: Map<string, any>,
): (InstantEvent | SpanEvent)[] {
  switch (event.entryType) {
    case 'mark':
      return [markToTraceEvent(event, { pid, tid }, markDetails)];
    case 'measure':
      return measureToTraceEvents(event, { pid, tid }, measureDetails);
    default:
      return [];
  }
}
