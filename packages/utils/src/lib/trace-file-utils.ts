import os from 'node:os';
import {
  type PerformanceEntry,
  type PerformanceMark,
  type PerformanceMeasure,
  performance,
} from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { defaultClock } from './clock-epoch.js';
import type {
  BeginEvent,
  CompleteEvent,
  EndEvent,
  InstantEvent,
  InstantEventArgs,
  SpanEvent,
  SpanEventArgs,
  StartTracingEvent,
  TraceEvent,
  TraceEventContainer,
} from './trace-file.type.js';

export const entryToTraceTimestamp = (
  entry: PerformanceEntry,
  asEnd = false,
): number =>
  defaultClock.fromPerfMs(
    entry.startTime +
      (entry.entryType === 'measure' && asEnd ? entry.duration : 0),
  );

// eslint-disable-next-line functional/no-let
let id2Count = 0;
export const nextId2 = () => ({ local: `0x${++id2Count}` });

const defaults = (opt?: { pid?: number; tid?: number; ts?: number }) => ({
  pid: opt?.pid ?? process.pid,
  tid: opt?.tid ?? threadId,
  ts: opt?.ts ?? defaultClock.epochNowUs(),
});

export const frameTreeNodeId = (pid: number, tid: number) =>
  Number.parseInt(`${pid}0${tid}`, 10);
export const frameName = (pid: number, tid: number) => `FRAME0P${pid}T${tid}`;

export const getInstantEvent = (opt: {
  name: string;
  ts?: number;
  pid?: number;
  tid?: number;
  args?: InstantEventArgs;
}): InstantEvent => ({
  cat: 'blink.user_timing',
  ph: 'i',
  name: opt.name,
  ...defaults(opt),
  args: opt.args ?? {},
});

export const getStartTracing = (opt: {
  url: string;
  ts?: number;
  pid?: number;
  tid?: number;
}): StartTracingEvent => {
  const { pid, tid, ts } = defaults(opt);
  const id = frameTreeNodeId(pid, tid);

  return {
    cat: 'devtools.timeline',
    ph: 'i',
    name: 'TracingStartedInBrowser',
    pid,
    tid,
    ts,
    args: {
      data: {
        frameTreeNodeId: id,
        frames: [
          {
            frame: frameName(pid, tid),
            isInPrimaryMainFrame: true,
            isOutermostMainFrame: true,
            name: '',
            processId: pid,
            url: opt.url,
          },
        ],
        persistentIds: true,
      },
    },
  };
};

export const getCompleteEvent = (opt: {
  name: string;
  dur: number;
  ts?: number;
  pid?: number;
  tid?: number;
}): CompleteEvent => ({
  cat: 'devtools.timeline',
  ph: 'X',
  name: opt.name,
  dur: opt.dur,
  ...defaults(opt),
  args: {},
});

type SpanOpt = {
  name: string;
  id2: { local: string };
  ts?: number;
  pid?: number;
  tid?: number;
  args?: SpanEventArgs;
};

export function getSpanEvent(ph: 'b', opt: SpanOpt): BeginEvent;
export function getSpanEvent(ph: 'e', opt: SpanOpt): EndEvent;
export function getSpanEvent(ph: 'b' | 'e', opt: SpanOpt): SpanEvent {
  return {
    cat: 'blink.user_timing',
    ph,
    name: opt.name,
    id2: opt.id2,
    ...defaults(opt),
    args: opt.args?.data?.detail
      ? { data: { detail: opt.args.data.detail } }
      : {},
  };
}

export const getSpan = (opt: {
  name: string;
  tsB: number;
  tsE: number;
  id2?: { local: string };
  pid?: number;
  tid?: number;
  args?: SpanEventArgs;
  tsMarkerPadding?: number;
}): [BeginEvent, EndEvent] => {
  // tsMarkerPadding is here to make the measure slightly smaller so the markers align perfectly.
  // Otherwise, the marker is visible at the start of the measure below the frame
  //       No padding   Padding
  // spans: ========   |======|
  // marks: |      |
  const pad = opt.tsMarkerPadding ?? 1;
  const id2 = opt.id2 ?? nextId2();

  return [
    getSpanEvent('b', {
      ...opt,
      id2,
      ts: opt.tsB + pad,
    }),
    getSpanEvent('e', {
      ...opt,
      id2,
      ts: opt.tsE - pad,
    }),
  ];
};

export const markToInstantEvent = (
  entry: PerformanceMark,
  opt?: { name?: string; pid?: number; tid?: number },
): InstantEvent =>
  getInstantEvent({
    ...opt,
    name: opt?.name ?? entry.name,
    ts: defaultClock.fromEntryStartTimeMs(entry.startTime),
    args: entry.detail ? { detail: entry.detail } : undefined,
  });

export const measureToSpanEvents = (
  entry: PerformanceMeasure,
  opt?: { name?: string; pid?: number; tid?: number },
): [BeginEvent, EndEvent] =>
  getSpan({
    ...opt,
    name: opt?.name ?? entry.name,
    tsB: entryToTraceTimestamp(entry),
    tsE: entryToTraceTimestamp(entry, true),
    args: entry.detail ? { data: { detail: entry.detail } } : undefined,
  });

export const getTraceFile = (opt: {
  traceEvents: TraceEvent[];
  startTime?: string;
}): TraceEventContainer => ({
  traceEvents: opt.traceEvents,
  displayTimeUnit: 'ms',
  metadata: {
    source: 'Node.js UserTiming',
    startTime: opt.startTime ?? new Date().toISOString(),
    hardwareConcurrency: os.cpus().length,
  },
});
