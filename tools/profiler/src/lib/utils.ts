import type {
  ExtendedPerformanceMark,
  ExtendedPerformanceMeasure,
} from './extensibility-api-profiler';
import type { DevToolsColor } from './extensibility-api.types';

export type DevtoolsSpanConfig<
  T extends string = string,
  G extends string = string,
> = {
  track: T;
  group?: G;
  color?: DevToolsColor;
};

export type DevtoolsSpansRegistry = Record<string, DevtoolsSpanConfig>;

export type DevtoolsTrackEntryDetail<
  Track extends string = string,
  Group extends string = string,
> = {
  devtools: {
    dataType: 'track-entry';
    track: Track;
    trackGroup?: Group;
    color?: DevToolsColor;
    properties?: [string, string][];
    tooltipText?: string;
  };
};

export function createDevtoolsSpans<const R extends DevtoolsSpansRegistry>(
  registry: R,
): {
  [K in keyof R]: (opts?: {
    properties?: [string, string][];
    tooltipText?: string;
    track?: R[K]['track'];
    group?: R[K]['group'];
    color?: DevToolsColor;
  }) => DevtoolsTrackEntryDetail<R[K]['track'], Extract<R[K]['group'], string>>;
} {
  type SpanKey = Extract<keyof R, string>;

  type SpanFn<K extends SpanKey> = (opts?: {
    properties?: [string, string][];
    tooltipText?: string;

    // optional overrides (rare)
    track?: R[K]['track'];
    group?: R[K]['group'];
    color?: DevToolsColor;
  }) => DevtoolsTrackEntryDetail<R[K]['track'], Extract<R[K]['group'], string>>;

  return (Object.keys(registry) as SpanKey[]).reduce(
    (acc, key) => {
      const def = registry[key];
      if (def == null) {
        throw new Error(`Invalid devtools span definition for key: ${key}`);
      }
      acc[key] = (opts => ({
        devtools: {
          dataType: 'track-entry',
          track: (opts?.track ?? def.track) as R[typeof key]['track'],
          trackGroup: (opts?.group ?? def.group) as any,
          color: opts?.color ?? def.color,
          properties: opts?.properties,
          tooltipText: opts?.tooltipText,
        },
      })) as SpanFn<typeof key>;

      return acc;
    },
    {} as { [K in SpanKey]: SpanFn<K> },
  );
}

const Devtools = createDevtoolsSpans({
  cli: { track: 'Analysis', group: 'Tools', color: 'primary' },
  plugins: { track: 'I/O', group: 'Tools', color: 'secondary' },
} as const);

const a: PerformanceMeasureOptions = performance.mark('a-start', {
  detail: Devtools.cli({
    properties: [
      ['Input Size', 'Large'],
      ['Complexity', 'O(n^2)'],
    ],
  }),
});
performance.measure('Read config', 'a-start');
performance.measure('Read config', a);

performance.measure('Analyze input', {
  start: a.start,
  detail: {
    ...a.detail,
    ...Devtools.cli({
      tooltipText: 'Heavy analysis',
    }),
  },
});

export type TraceEvent =
  | {
      cat: 'blink.user_timing';
      name: string;
      ph: 'b' | 'e';
      pid: number;
      tid: number;
      ts: number;
      id2: { local: string };
      args: Record<string, unknown>;
    }
  | {
      cat: 'blink.user_timing';
      name: string;
      ph: 'i';
      s: 't';
      pid: number;
      tid: number;
      ts: number;
      args: Record<string, unknown>;
    };

/**
 * Helper for MEASURE entries
 * - emits async begin/end (b/e)
 * - uses a simple incrementing id
 * - timestamps stay in ms
 */
export function measureToTraceEvents(
  entry: PerformanceMeasure | ExtendedPerformanceMeasure,
  ctx: { pid: number; tid: number; nextId: () => number },
): TraceEvent[] {
  const id = ctx.nextId();
  const id2 = { local: `0x${id.toString(16).toUpperCase()}` };
  console.log('entry', JSON.stringify(entry));
  const begin: TraceEvent = {
    cat: 'blink.user_timing',
    name: entry.name,
    ph: 'b',
    pid: ctx.pid,
    tid: ctx.tid,
    ts: Math.round(entry.startTime),
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
    ts: Math.round(entry.startTime + entry.duration),
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
  entry: PerformanceMark | ExtendedPerformanceMark,
  ctx: { pid: number; tid: number },
): TraceEvent {
  return {
    cat: 'blink.user_timing',
    name: entry.name,
    ph: 'i',
    s: 't',
    pid: ctx.pid,
    tid: ctx.tid,
    ts: Math.round(entry.startTime),
    args: entry.detail == null ? {} : { detail: JSON.stringify(entry.detail) },
  };
}
