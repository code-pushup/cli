# Enable Extensibility API for NodeJS

The goal is to enable Browser functionality in the NodeJS environment, specifically the Extensibility API used for Performance profiling.

```ts
// Mark used to represent the start of the image processing task
// The start time is defaulted to now
const imageProcessinTimeStart = performance.now();

// ... later in your code

// Track entry representing the completion of image processing
// with additional details and a tooltip
// The start time is a marker from earlier
// The end time is defaulted to now
performance.measure('Image Processing Complete', {
  start: imageProcessinTimeStart,
  detail: {
    devtools: {
      dataType: 'track-entry',
      track: 'Image Processing Tasks',
      trackGroup: 'My Tracks', // Group related tracks together
      color: 'tertiary-dark',
      properties: [
        ['Filter Type', 'Gaussian Blur'],
        ['Resize Dimensions', '500x300'],
      ],
      tooltipText: 'Image processed successfully',
    },
  },
});
```

## Problem

ATM NodeJS `--cpu-pro` or similar flags do not support the Extensibility API used by Chrome DevTools for Performance profiling.
Nevertheless, calling the API with additional details does not cause any issues or logs.

## Solution

### Trace persistence

### PerformanceEntry to Trace Event helper

A helper function can be created to convert `PerformanceEntry` objects into Trace Events that can be consumed by Chrome DevTools.

### Track Entry helper

```ts
export type DevtoolsSpanConfig<T extends string = string, G extends string = string> = {
  track: T;
  group?: G;
  color?: DevToolsColor;
};

export type DevtoolsSpansRegistry = Record<string, DevtoolsSpanConfig>;

export function createDevtoolsSpans<const R extends DevtoolsSpansRegistry>(registry: R) {
  type SpanKey = Extract<keyof R, string>;

  type SpanFn<K extends SpanKey> = (opts?: {
    properties?: [string, string][];
    tooltipText?: string;

    // optional overrides (rare)
    track?: R[K]['track'];
    group?: R[K]['group'];
    color?: DevToolsColor;
  }) => DevtoolsTrackEntryDetail<R[K]['track'], Extract<R[K]['group'], string>>;

  const spans = {} as { [K in SpanKey]: SpanFn<K> };

  for (const key of Object.keys(registry) as SpanKey[]) {
    const def = registry[key];

    spans[key] = (opts => ({
      devtools: {
        dataType: 'track-entry',
        track: (opts?.track ?? def.track) as R[typeof key]['track'],
        trackGroup: (opts?.group ?? def.group) as any,
        color: opts?.color ?? def.color,
        properties: opts?.properties,
        tooltipText: opts?.tooltipText,
      },
    })) as SpanFn<typeof key>;
  }

  return spans;
}

const Devtools = createDevtoolsSpans({
  analysis: { track: 'Analysis', group: 'Tools', color: 'primary' },
  io: { track: 'I/O', group: 'Tools', color: 'secondary' },
} as const);

const a: PerformanceMeasureOptions = performance.mark('a-start', {
  detail: Devtools.analysis({
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
  detail: Devtools.analysis({
    tooltipText: 'Heavy analysis',
  }),
});
```

## References

- https://developer.chrome.com/docs/devtools/performance/extension?hl=de#tracks
