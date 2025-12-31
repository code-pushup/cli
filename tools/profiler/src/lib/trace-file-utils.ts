import { performance } from 'node:perf_hooks';
import { markToTraceEvent } from './trace-file-output';
import type {
  BeginEvent,
  CompleteEvent,
  EndEvent,
  InstantEvent,
  SpanEvent,
  TraceEvent,
} from './trace-file.type';
import type { DevToolsPayload } from './user-timing-details.type';

/**
 * Converts a performance entry's timestamp to Chrome trace format timestamp in microseconds.
 *
 * @param entry - Performance entry (mark, measure) containing startTime and potential duration
 * @param asEndTime - Optional flag to calculate end time for measures
 * @returns Timestamp in microseconds, aligned with Chrome trace format
 */
export function entryToTraceTimestamp(
  entry: PerformanceEntry,
  asEndTime: boolean = false,
): number {
  const duration =
    entry.entryType === 'measure' && asEndTime ? entry.duration : 0;
  const relativeTime = entry.startTime + duration;
  const timeOriginBase = 1766930000000; // Base to align with Chrome trace format
  const effectiveTimeOrigin = performance.timeOrigin - timeOriginBase;
  return Math.round((effectiveTimeOrigin + relativeTime) * 1000);
}

const nextId2 = (() => {
  let counter = 1;
  return () => ({ local: `0x${counter++}` });
})();

export function markToEventInstant(
  entry: PerformanceMark,
  options: {
    name: string;
    pid: number;
    tid: number;
  },
): InstantEvent {
  return getInstantEvent({
    ...options,
    ts: entryToTraceTimestamp(entry),
    argsDataDetail: entry.detail,
  });
}

export type DetailShortcut = {
  argsDataDetail?: {
    devtools: DevToolsPayload;
  };
};

export function getEventArgsPayload(argsDataDetail?: Record<string, unknown>) {
  return argsDataDetail
    ? {
        data: {
          detail: JSON.stringify(argsDataDetail),
        },
      }
    : {};
}

export function getInstantEvent(
  options: {
    name: string;
    ts: number;
    pid: number;
    tid: number;
  } & DetailShortcut,
): InstantEvent {
  const { argsDataDetail, ...opt } = options;
  return {
    ...opt,
    cat: 'blink.user_timing',
    s: 't', // Timeline scope,
    ph: 'I', // Uppercase I for instant events in Chrome DevTools format
    args: getEventArgsPayload(argsDataDetail),
  };
}

/**
 * Helper for Error Mark entries
 * - emits an instant event (ph: i)
 * - timestamps stay in ms
 */
export function errorToInstantEvent(
  error: unknown,
  options: {
    name: string;
    pid: number;
    tid: number;
    ts: number;
  } & DetailShortcut,
): InstantEvent {
  const errorName = error instanceof Error ? error.name : 'UnknownError';

  return getInstantEvent({
    ...options,
    name: `err-${errorName}`,
  });
}

export function getSpanEvent(
  ph: 'b' | 'e',
  opt: Pick<SpanEvent, 'name' | 'pid' | 'tid' | 'ts' | 'id2'> & DetailShortcut,
): BeginEvent | EndEvent {
  const { argsDataDetail, ...options } = opt;

  return {
    cat: 'blink.user_timing',
    s: 't',
    ph,
    ...options,
    args: getEventArgsPayload(argsDataDetail),
  };
}

export function measureToSpanEvents(
  entry: PerformanceMeasure,
  options: Pick<SpanEvent, 'pid' | 'tid'>,
): [BeginEvent, EndEvent] {
  const startUs = entryToTraceTimestamp(entry);
  const endUs = entryToTraceTimestamp(entry, true);

  const name = entry.name;
  const id2 = nextId2();

  const begin = getSpanEvent('b', {
    ...options,
    name,
    id2,
    ts: startUs,
  }) as BeginEvent;

  const end = getSpanEvent('e', {
    ...options,
    name,
    id2,
    ts: endUs,
    argsDataDetail: entry?.detail,
  }) as EndEvent;

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
  ts: number;
  url: string;
}): TraceEvent {
  const { ts, pid, url, tid } = opt;
  const frameTreeNodeId = getFrameTreeNodeId(pid, tid);
  return {
    cat: 'devtools.timeline',
    name: 'TracingStartedInBrowser',
    ph: 'I',
    pid,
    tid,
    ts,
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

export function getCompleteEvent(opt: {
  pid: number;
  tid: number;
  ts: number;
  dur: number;
}): CompleteEvent {
  return {
    ...opt,
    args: {},
    cat: 'devtools.timeline',
    name: 'RunTask',
    ph: 'X',
  };
}
