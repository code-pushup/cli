import * as fs from 'node:fs/promises';
import path from 'node:path';
import {
  createTraceFile,
  decodeEvent,
  encodeEvent,
  frameName,
  frameTreeNodeId,
} from '../src/lib/profiler/trace-file-utils.js';
import type {
  TraceEvent,
  TraceEventContainer,
  TraceMetadata,
} from '../src/lib/profiler/trace-file.type';

const BASE_TS = 1_700_000_005_000_000;
const FIXED_TIME = '2026-01-28T14:29:27.995Z';

/* ───────────── IO ───────────── */
const read = (p: string) => fs.readFile(p, 'utf8').then(s => s.trim());
const parseJsonl = (s: string) =>
  s
    .split('\n')
    .filter(Boolean)
    .map(l => JSON.parse(l));
const parseDecodeJsonl = (s: string) => parseJsonl(s).map(decodeEvent);

/* ───────────── Metadata ───────────── */
const normMeta = (
  m?: TraceMetadata | Record<string, unknown>,
  keepGen = true,
): TraceMetadata | undefined =>
  m
    ? ({
        ...(keepGen
          ? m
          : Object.fromEntries(
              Object.entries(m).filter(([k]) => k !== 'generatedAt'),
            )),
        startTime: FIXED_TIME,
        ...(keepGen && { generatedAt: FIXED_TIME }),
      } as TraceMetadata)
    : undefined;

/* ───────────── Detail ───────────── */
const normalizeDetail = (d: unknown): unknown => {
  const o =
    typeof d === 'string'
      ? JSON.parse(d)
      : typeof d === 'object' && d
        ? d
        : null;
  const props = o?.devtools?.properties;
  if (!Array.isArray(props)) return d;

  const isTransition = props.some(
    e => Array.isArray(e) && e[0] === 'Transition',
  );

  return {
    ...o,
    devtools: {
      ...o.devtools,
      properties: props.map(e => {
        if (!Array.isArray(e) || typeof e[0] !== 'string') return e;
        const [k, v] = e;
        if (isTransition) {
          if (k.toLowerCase() === 'groupid') return [k, 'group-id'];
          if (k.toLowerCase().includes('path'))
            return [k, `path/to/${path.basename(String(v))}`];
        }
        if (k.includes('Path') || k.includes('Files'))
          return [
            k,
            Array.isArray(v)
              ? v.map(x => path.basename(String(x)))
              : path.basename(String(v)),
          ];
        return e;
      }),
    },
  };
};

/* ───────────── Context ───────────── */
const uniq = <T>(v: (T | undefined)[]) => [
  ...new Set(v.filter(Boolean) as T[]),
];
const ctx = (e: TraceEvent[], base = BASE_TS) => ({
  pid: new Map(
    [...uniq(e.map(x => x.pid))]
      .sort()
      .map((v, i) => [v, 10_001 + i]),
  ),
  tid: new Map(
    [...uniq(e.map(x => x.tid))]
      .sort()
      .map((v, i) => [v, i + 1]),
  ),
  ts: new Map(
    [...uniq(e.map(x => x.ts))]
      .sort()
      .map((v, i) => [v, base + i * 100]),
  ),
  id: new Map(
    [...uniq(e.map(x => x.id2?.local))]
      .sort()
      .map((v, i) => [v, `0x${(i + 1).toString(16)}`]),
  ),
});

/* ───────────── Event normalization ───────────── */
const mapIf = <T, R>(v: T | undefined, m: Map<T, R>, k: string) =>
  v != null && m.has(v) ? { [k]: m.get(v)! } : {};

const normalizeEvent = (
  e: TraceEvent,
  c: ReturnType<typeof ctx>,
): TraceEvent => {
  const pid = c.pid.get(e.pid) ?? e.pid;
  const tid = c.tid.get(e.tid) ?? e.tid;

  const args = e.args && {
    ...e.args,
    ...(e.args.detail !== undefined && {
      detail: normalizeDetail(e.args.detail),
    }),
    ...(e.args.data &&
      typeof e.args.data === 'object' && {
        data: {
          ...(e.args.data as any),
          ...(pid &&
            tid &&
            'frameTreeNodeId' in e.args.data && {
              frameTreeNodeId: frameTreeNodeId(pid, tid),
            }),
          ...(Array.isArray((e.args.data as any).frames) &&
            pid &&
            tid && {
              frames: (e.args.data as any).frames.map((f: any) => ({
                ...f,
                processId: pid,
                frame: frameName(pid, tid),
              })),
            }),
        },
      }),
  };

  return {
    ...e,
    ...mapIf(e.pid, c.pid, 'pid'),
    ...mapIf(e.tid, c.tid, 'tid'),
    ...mapIf(e.ts, c.ts, 'ts'),
    ...(e.id2?.local &&
      c.id.has(e.id2.local) && {
        id2: { ...e.id2, local: c.id.get(e.id2.local)! },
      }),
    ...(args && { args }),
  };
};

/* ───────────── Public normalization ───────────── */
export const normalizeTraceEvents = (
  events: TraceEvent[],
  { baseTimestampUs = BASE_TS } = {},
) => {
  if (events.length === 0) return [];
  const decoded = events.map(decodeEvent);
  const c = ctx(decoded, baseTimestampUs);
  return decoded.map(e => normalizeEvent(e, c));
};

export const normalizeAndFormatEvents = (
  input: TraceEvent[] | string,
  opts?: { baseTimestampUs: number },
) =>
  typeof input === 'string'
    ? input.trim()
      ? normalizeTraceEvents(parseJsonl(input).map(decodeEvent), opts)
          .map(encodeEvent)
          .map(o => JSON.stringify(o))
          .join('\n') + (input.endsWith('\n') ? '\n' : '')
      : input
    : normalizeTraceEvents(input, opts);

/* ───────────── Loaders ───────────── */
export const loadAndOmitTraceJsonl = (p: `${string}.jsonl`, o?: any) =>
  read(p).then(s => normalizeAndFormatEvents(parseDecodeJsonl(s), o));

export const loadTraceJsonlForSnapshot = loadAndOmitTraceJsonl;

export const loadAndOmitTraceJson = async (
  p: string,
  o?: { baseTimestampUs: number },
): Promise<TraceEventContainer> => {
  const j = JSON.parse(await read(p));
  if (!j?.traceEvents) return { traceEvents: [] };
  const r = {
    traceEvents: normalizeAndFormatEvents(j.traceEvents.map(decodeEvent), o),
    ...(j.displayTimeUnit && { displayTimeUnit: j.displayTimeUnit }),
    ...(j.metadata && { metadata: normMeta(j.metadata) }),
  };
  JSON.stringify(r);
  return r;
};

export const loadNormalizedTraceJson = async (
  p: `${string}.json`,
): Promise<TraceEventContainer> => {
  const j = JSON.parse(await read(p));
  const r = createTraceFile({
    traceEvents: normalizeTraceEvents(j.traceEvents?.map(decodeEvent) ?? []),
    metadata: normMeta(j.metadata, false),
    startTime: j.metadata?.startTime,
  });
  const { displayTimeUnit, ...rest } = r;
  return rest;
};

export const loadNormalizedTraceJsonl = async (
  p: `${string}.jsonl`,
): Promise<TraceEventContainer> =>
  createTraceFile({
    traceEvents: normalizeTraceEvents(parseDecodeJsonl(await read(p))),
  });
