export type TraceEvent = {
  cat: string;
  name: string;
  s?: string;
  ph: string;
  pid: number;
  tid: number;
  ts: number;
  dur?: number;
  id2?: { local: string };
  args?: Record<string, unknown>;
};

/**
 * Helper for MEASURE entries
 * - emits async begin/end (b/e)
 * - uses a simple incrementing id
 * - timestamps stay in ms
 */
export function measureToTraceEvents(
  entry: PerformanceMeasure,
  ctx: { pid: number; tid: number; nextId2: () => { local: string } },
): TraceEvent[] {
  const id2 = ctx.nextId2(); // call once per measure

  const startUs = Math.round(entry.startTime * 1000);
  const endUs = Math.round((entry.startTime + entry.duration) * 1000);

  const begin: TraceEvent = {
    cat: 'blink.user_timing',
    name: entry.name,
    ph: 'b',
    pid: ctx.pid,
    tid: ctx.tid,
    ts: startUs,
    id2,
    args:
      entry.detail === undefined
        ? {}
        : { detail: JSON.stringify(entry.detail) },
  };

  const end: TraceEvent = {
    cat: 'blink.user_timing',
    name: entry.name,
    ph: 'e',
    pid: ctx.pid,
    tid: ctx.tid,
    ts: endUs,
    id2,
    args: {},
  };

  return [begin, end];
}

/**
 * Helper for MARK entries
 * - emits an instant event (ph: i)
 * - timestamps stay in ms
 */
export function markToTraceEvent(
  entry: PerformanceMark,
  ctx: { pid: number; tid: number; nextId2: () => { local: string } },
): TraceEvent {
  return {
    cat: 'blink.user_timing',
    name: entry.name,
    ph: 'b',
    pid: ctx.pid,
    tid: ctx.tid,
    ts: Math.round(entry.startTime * 1000),
    id2: ctx.nextId2(),
    args:
      entry.detail === undefined
        ? {}
        : { detail: JSON.stringify(entry.detail) },
  };
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
): TraceEvent {
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
  };
}

export function getRunTaskTraceEvent(
  pid: number,
  tid: number,
  opt: {
    ts: number;
    dur: number;
  },
): TraceEvent {
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
  };
}
