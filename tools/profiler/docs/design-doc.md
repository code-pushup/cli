# Enable Extensibility API for NodeJS

The goal is to enable Browser functionality in the NodeJS environment, specifically the Extensibility API used for Performance profiling.

_Example - NodeJS code:_

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

_Example - ChromeDevTools Performance panel:_

![example-custom-track.png](imgs/example-custom-track.png)

## Problem

ATM NodeJS `--cpu-pro` or similar flags do not support the Extensibility API used by Chrome DevTools for Performance profiling.
Nevertheless, calling the API with additional details does not cause any issues or logs.

## Solution

The solution requires multiple building blocks elaborated below:

- Utils
  - Persist trace data
  - PerformanceEntry to Trace Event
  - PerformanceEntry Details helper
- Profiler
  - API
  - Usage

### Utils

#### Persist trace data

Trace persistence is implemented in 2 steps:

- at runtime add trace events to an in-memory structure
- at the end of the profiling session, serialize the trace events to a file or the terminal.

#### PerformanceEntry to Trace Event helper

A helper function can be created to convert `PerformanceEntry` objects into Trace Events that can be consumed by Chrome DevTools.

```ts
const markA: PerformanceMeasureOptions = performance.mark('a-start');
const measureA = performance.measure('Run A', markA);
const traceEvents = [convertPerformanceMarkEntryToTraceEvent(markA), convertPerformanceMarkEntryToTraceEvent(measureA)];
```

#### PerformanceEntry Details helper

```ts
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
    ...a.details.devtools,
    tooltipText: 'Heavy analysis',
  }),
});
```

### Profiler

The profiler handles the integration with NodeJS processes, as well as the trace data creation and persistence.

#### API

- `#writeLine` - writes a single line to the output stream
- `#installExitHandlers` - sets up handlers to flush data on process exit
- handles normal exit, uncaught exceptions, and termination signals
- `enableProfiling` - sets up the profiler to capture trace events
- `spans` - Helper to create span details for PerformanceEntry objects
- configured with predefined tracks, groups, and colors
- `mark` - Equivalent to `performance.mark`, but also captures trace events
- `measure` - Equivalent to `performance.measure`, but also captures trace events
- `flush` - Writes the captured trace events to a file or terminal
- `close` - Cleans up resources used by the profiler

#### Usage

```ts
const profiler = new Profiler({
  outputPath: 'trace-output.json',
  spans: {
    analysis: { track: 'Analysis', group: 'Tools', color: 'primary' },
    io: { track: 'I/O', group: 'Tools', color: 'secondary' },
  },
});

const taskLoadConfig = profiler.mark('start-loadConfig', {
  detail: profiler.spans.io({
    properties: [['Config File', 'code-pushup.config.json']],
  }),
});
profiler.measure('run-loadConfig', taskLoadConfig);
```

```shell
# Profile Code PushUp CLI
CP_PROFILING=true npm @code-pushup/cli
# Or Profile with Code PushUp NxPlugin
nx run @code-pushup/nx-plugin:cli --profiling --profiling-output=trace.json

# Both write the trace to the file system
```

### Track Design

Lanes represent different components of the system being profiled.

```txt
CodePushUp CLI - Custom
 ├─ CLI                  ████████████████████████
 │  ├─ load config       █
 │  └─ save report                        ███████
 │
 ├─ Plugin:eslint         █████████
 │  ├─ run eslint         █████
 │  └─ parse output            ████
 │
 └─ Plugin:bundle-budget           ███████
    ├─ run stats                   █████
    └─ parse output                     ██
```

| Track Group | Track Name            | Color              | Description                 |
| ----------- | --------------------- | ------------------ | --------------------------- |
| CodePushup  | CLI                   | 🟦 tertiary-dark   | Main CLI process and tasks  |
| CodePushup  | CLI                   | 🟦 tertiary-light  | Detailed CLI operations     |
| Plugins     | Plugin:<name>         | 🟪 secondary-dark  | Individual plugin execution |
| Plugins     | Plugin:<name>:details | 🟪 secondary-light | Plugin details and steps    |

## References

- https://developer.chrome.com/docs/devtools/performance/extension?hl=de#tracks
