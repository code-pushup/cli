import { performance } from 'node:perf_hooks';
import { markToTraceEvent, measureToTraceEvents } from './trace-file-output';
import type {
  BeginEvent,
  CompleteEvent,
  EndEvent,
  InstantEvent,
  SpanEvent,
  TraceEvent,
} from './trace-file.type';
import { createErrorLabelFromError } from './user-timing-details-utils';

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
export function relativeToAbsuloteTime(
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
  pid: number;
  tid: number;
  nextId2?: () => { local: string }; // Optional since not used for instant events
}): InstantEvent {
  // {"args":{"data":{"callTime":37300251007,"detail":"{\"name\":\"invoke-has-pre-registration-flag\",\"componentName\":\"messaging\",\"spanId\":3168785428,\"traceId\":613107129,\"error\":false}","navigationId":"234F7482B1E9D4B1EEA32305D6FBF815","sampleTraceId":8589113407370704,"startTime":229}},"cat":"blink.user_timing","name":"start-invoke-has-pre-registration-flag","ph":"I","pid":31825,"s":"t","tid":1197643,"ts":37300250992,"tts":179196},
  const { pid, tid, nextId2, entry, name, ts } = options;

  // Determine timestamp: use provided ts, or calculate from entry if available
  // Use absolute timestamps for cross-process alignment (Strategy B)
  const timestamp = entry
    ? relativeToAbsuloteTime(ts, entry.startTime)
    : relativeToAbsuloteTime(ts);

  // @TODO remove after tests
  const offset = entry ? entry.detail?.offest : 0;

  const traceEvent: InstantEvent = {
    cat: 'blink.user_timing',
    name: name,
    ph: 'I', // Uppercase I for instant events in Chrome DevTools format
    s: 't', // Timeline scope
    pid,
    tid,
    ts: timestamp + offset,
    args: {
      data: {
        ...(entry?.detail && { detail: JSON.stringify(entry?.detail) }),
      },
    },
  };

  return traceEvent;
}

/**
 * Helper for Error Mark entries
 * - emits an instant event (ph: i)
 * - timestamps stay in ms
 */
export function errorToInstantEvent(
  error: unknown,
  options: {
    pid: number;
    tid: number;
  },
): InstantEvent {
  const { pid, tid } = options;

  const errorName = error instanceof Error ? error.name : 'UnknownError';

  return {
    cat: 'blink.user_timing',
    name: `err-${errorName}`,
    ph: 'I',
    s: 't',
    pid,
    tid,
    ts: relativeToAbsuloteTime(),
    args: {
      data: {
        detail: JSON.stringify({
          devtools: createErrorLabelFromError(error),
        }),
      },
    },
  };
}

export function getSpanEvent(
  ph: 'b',
  opt: Pick<SpanEvent, 'name' | 'pid' | 'tid' | 'ts' | 'id2'> & {
    argsDetail?: Record<string, unknown>;
  },
): BeginEvent;
export function getSpanEvent(
  ph: 'e',
  opt: Pick<SpanEvent, 'name' | 'pid' | 'tid' | 'ts' | 'id2'> & {
    argsDetail: Record<string, unknown>;
  },
): EndEvent;
export function getSpanEvent(
  ph: 'b' | 'e',
  opt: Pick<SpanEvent, 'name' | 'pid' | 'tid' | 'ts' | 'id2'> & {
    argsDetail: Record<string, unknown>;
  },
): BeginEvent | EndEvent {
  const { pid, tid, name, ts, id2, argsDetail, ...options } = opt;
  return {
    cat: 'blink.user_timing',
    name,
    ph,
    pid,
    tid,
    ts,
    id2,
    args: argsDetail ? { detail: JSON.stringify(argsDetail) } : {},
    ...options,
  };
}

const z = getSpanEvent('b', {
  ts: 0,
  pid: 0,
  tid: 0,
  name: '',
  id2: { local: '0x0' },
});

export function getTimingEventSpan(
  entry: PerformanceMeasure,
  options: Pick<SpanEvent, 'pid' | 'tid' | 'ts' | 'name'>,
): [BeginEvent, EndEvent] {
  const { pid, tid, name: explicitName } = options;

  const eventName = explicitName ?? entry.name;
  const startUs = relativeToAbsuloteTime(undefined, entry.startTime);
  const endUs = relativeToAbsuloteTime(
    undefined,
    entry.startTime + entry.duration,
  );

  // For measures, try to get detail from the corresponding start mark
  let measureDetail = entry?.detail;
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

  const argsDetail = measureDetail
    ? Object.assign({}, measureDetail)
    : undefined;

  const id2 = nextId2();

  const begin: BeginEvent = getSpanEvent('b', {
    name: eventName,
    pid,
    tid,
    ts: startUs,
    id2,
    argsDetail,
  });

  const end: EndEvent = getSpanEvent('e', {
    name: eventName,
    pid,
    tid,
    ts: endUs,
    id2,
    argsDetail,
  });

  return [begin, end];
}

export function getFrameTreeNodeId(pid: number, tid: number): number {
  return Number.parseInt(`${pid}0${tid}`);
}

export function getFrameName(pid: number, tid: number): string {
  return `FRAME0P${pid}T${tid}`;
}

export function getStartTracing(opt: {
  pid: number;
  tid: number;
  traceStartTs: number;
  url: string;
}): TraceEvent {
  const { traceStartTs, url, pid, tid } = opt;
  const frameTreeNodeId = getFrameTreeNodeId(pid, tid);
  return {
    cat: 'devtools.timeline',
    name: 'TracingStartedInBrowser',
    ph: 'I',
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
  };
}

export function getCompleteEvent(
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
 * Convert a ProfilingEvent (mark or measure) to TraceEvent(s)
 */
export function timingEventToTraceEvent(
  event: import('./trace-file-output').ProfilingEvent,
  opt: Pick<TraceEvent, 'pid' | 'tid' | 'ts'>,
): (InstantEvent | SpanEvent)[] {
  const { pid, tid, ts } = opt;
  switch (event.entryType) {
    case 'mark':
      return [markToTraceEvent(event, { pid, tid, ts })];
    case 'measure':
      return measureToTraceEvents(event, { pid, tid, ts });
    default:
      return [];
  }
}
