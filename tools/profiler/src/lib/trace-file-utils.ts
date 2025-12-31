import { performance } from 'node:perf_hooks';
import type {
  BeginEvent,
  CompleteEvent,
  EndEvent,
  InstantEvent,
  SpanEvent,
  TraceEvent,
} from './trace-file.type';
import type {
  DevToolsLabel,
  DevToolsLabelError,
  DevToolsMark,
  DevToolsPayload,
} from './user-timing-details.type';

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

/**
 * Converts a performance.now() timestamp to Chrome trace format timestamp in microseconds.
 *
 * @param performanceNow - Timestamp from performance.now() in milliseconds
 * @returns Timestamp in microseconds, aligned with Chrome trace format
 */
export function performanceTimestampToTraceTimestamp(
  performanceNow: number,
): number {
  const timeOriginBase = 1766930000000; // Base to align with Chrome trace format
  const effectiveTimeOrigin = performance.timeOrigin - timeOriginBase;
  return Math.round((effectiveTimeOrigin + performanceNow) * 1000);
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

export type MeasureDetailShortcut = {
  // needed for ph I timing marks only (assuming a bug in ChromeDevtools :) )
  argsDetail?: {
    devtools: DevToolsPayload;
  };
};
export type MarkerDetailShortcut = {
  // needed for ph b/e timing entries only (assuming a bug in ChromeDevtools :) )
  argsDataDetail?: {
    devtools: DevToolsMark | DevToolsLabel;
  };
};
export type DevtoolsDetailShortcuts = MeasureDetailShortcut &
  MarkerDetailShortcut;

export function getEventArgsPayload(args: DevtoolsDetailShortcuts) {
  const { argsDataDetail, argsDetail } = args;
  return {
    ...(argsDetail ? { detail: JSON.stringify(argsDetail) } : {}),
    data: {
      ...(argsDataDetail ? { detail: JSON.stringify(argsDataDetail) } : {}),
    },
  };
}

export function getInstantEvent(
  options: {
    name: string;
    ts: number;
    pid: number;
    tid: number;
  } & MarkerDetailShortcut,
): InstantEvent {
  const { argsDataDetail, name, pid, tid, ts } = options;
  return {
    cat: 'blink.user_timing',
    s: 't', // Timeline scope,
    ph: 'I', // Uppercase I for instant events in Chrome DevTools format
    name,
    pid,
    tid,
    ts,
    args: getEventArgsPayload({ argsDataDetail }),
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
  } & MeasureDetailShortcut,
): InstantEvent {
  const errorName = error instanceof Error ? error.name : 'UnknownError';

  return getInstantEvent({
    ...options,
    name: `err-${errorName}`,
  });
}

export function getSpanEvent(
  ph: 'b' | 'e',
  opt: Pick<SpanEvent, 'name' | 'pid' | 'tid' | 'ts' | 'id2'> &
    MeasureDetailShortcut,
): BeginEvent | EndEvent {
  const { argsDetail, name, pid, tid, ts, id2 } = opt;

  return {
    cat: 'blink.user_timing',
    s: 't',
    ph,
    name,
    pid,
    tid,
    ts,
    id2,
    args: getEventArgsPayload({ argsDetail }),
  };
}

export function measureToSpanEvents(
  entry: PerformanceMeasure,
  options: Pick<SpanEvent, 'pid' | 'tid'>,
): [BeginEvent, EndEvent] {
  // make the measure slightly smaller so the markers align perfectly.
  // Otherwise, the marker is visible at the start of the measure below the frame
  //
  //        No padding     Padding
  // spans: ========      |======|
  // marks: |      |
  const tsMarkerPadding = 1;
  const startUs = entryToTraceTimestamp(entry) + tsMarkerPadding;
  const endUs = entryToTraceTimestamp(entry, true) - tsMarkerPadding;

  const name = entry.name;
  const id2 = nextId2();

  const begin = getSpanEvent('b', {
    ...options,
    name,
    id2,
    ts: startUs,
    argsDetail: entry?.detail,
  }) as BeginEvent;

  const end = getSpanEvent('e', {
    ...options,
    name,
    id2,
    ts: endUs,
    argsDetail: entry?.detail,
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
    s: 't',
    ph: 'I',
    name: 'TracingStartedInBrowser',
    pid,
    tid,
    ts,
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
  const { ts, pid, tid, dur } = opt;
  return {
    cat: 'devtools.timeline',
    ph: 'X',
    name: 'RunTask',
    pid,
    tid,
    ts,
    dur,
    args: {},
  };
}
