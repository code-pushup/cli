# Code PushUp Profiler

A performance profiling tool that captures timing data in Chrome DevTools trace format for visualization and analysis.

## Usage

```typescript
import { getProfiler } from '@code-pushup/profiler';

const profiler = getProfiler({
  enabled: true,
  outDir: 'tmp/profiles',
  fileBaseName: 'app-timing',
});

profiler.span('load-config', () => loadConfig());
await profiler.spanAsync('process-data', async () => {
  return await processLargeDataset();
});
profiler.instant('app-ready');
profiler.close();
```

## Configuration

```typescript
export type ProfilerOptions<K extends string = never> = {
  enabled?: boolean; // Enable/disable profiling (default: env.CP_PROFILING)
  outDir?: string; // Output directory (default: 'tmp/profiles')
  fileBaseName?: string; // Base name for output files (default: 'timing.profile')
  metadata?: Record<string, unknown>; // Custom metadata to include
  spans?: Partial<DevtoolsSpansRegistry<K>>; // Custom span definitions
};
```

## API

### Profiler

// ASCII chart of profiler architecture (perf observer, file output format,... maybe some more)
// Profiler -> TraceFile -> TraceEvent
// |
// v
// PerformanceObserver -> TraceEvent
// |
// v
// LineOutput -> TraceEvent

```typescript
const profiler = getProfiler({ enabled: true });

// Synchronous span
profiler.span('load-config', () => loadConfig());

// Asynchronous span
await profiler.spanAsync('process-data', async () => {
  return await processLargeDataset();
});

// Instant event (marker)
profiler.instant('app-ready');

// Custom performance marks and measures
profiler.mark('custom-start');
profiler.measure('custom-duration', 'custom-start');

await profiler.flush();
await profiler.close();
```

```typescript
const profiler = getProfiler({ enabled: true });

profiler.span('load-config', () => loadConfig());
profiler.span('process-data', () => processData(), {
  detail: profiler.spans.database(),
});

await profiler.spanAsync('fetch-users', async () => {
  return await api.getUsers();
});

profiler.instant('app-ready');

profiler.mark('custom-start');
profiler.measure('custom-duration', 'custom-start');
await profiler.flush();
await profiler.close();

profiler.enabled;
profiler.filePath;
profiler.spans;
```

### Span Helpers

```typescript
const profiler = getProfiler({
  spans: {
    database: { track: 'Database', group: 'IO', color: 'secondary-dark' },
    network: { track: 'Network', color: 'primary' },
    plugin: { track: name => `Plugin:${name}`, color: 'tertiary' },
  },
});

profiler.span('query-users', () => db.query('SELECT * FROM users'), {
  detail: profiler.spans.database(),
});

profiler.span('eslint-check', () => runEslint(), {
  detail: profiler.spans.plugin('eslint'),
});
```

### Trace Events

```jsonl
{"cat":"blink.user_timing","name":"load-config","ph":"X","pid":123,"tid":456,"ts":1000,"dur":500}
{"cat":"blink.user_timing","name":"process-data","ph":"b","pid":123,"tid":456,"ts":1500}
{"cat":"blink.user_timing","name":"process-data","ph":"e","pid":123,"tid":456,"ts":2000}
{"cat":"blink.user_timing","name":"app-ready","ph":"i","pid":123,"tid":456,"ts":2500}
{"cat":"blink.user_timing","name":"database-query","ph":"X","pid":123,"tid":456,"ts":3000,"dur":200,"args":{"detail":"{\"devtools\":{\"dataType\":\"track-entry\",\"track\":\"Database\",\"trackGroup\":\"IO\",\"color\":\"secondary-dark\"}}"}}
```

### Trace File

```typescript
const profiler = getProfiler({
  outDir: 'tmp/profiles',
  fileBaseName: 'timing',
});

profiler.filePath;
```

```jsonl
{"cat":"devtools.timeline","name":"TracingStartedInBrowser","ph":"i","s":"t","pid":123,"tid":456,"ts":0,"args":{"data":{"frameTreeNodeId":"1230456","frames":[{"frame":"FRAME0P123T456","isInPrimaryMainFrame":true,"isOutermostMainFrame":true,"name":"","processId":123,"url":""}]}}}
{"cat":"blink.user_timing","name":"load-config","ph":"b","pid":123,"tid":456,"ts":1000000,"id2":{"local":"0x1"}}
{"cat":"blink.user_timing","name":"load-config","ph":"e","pid":123,"tid":456,"ts":1500000,"id2":{"local":"0x1"}}
{"cat":"blink.user_timing","name":"app-ready","ph":"i","pid":123,"tid":456,"ts":1600000,"id2":{"local":"0x2"}}
```

### Output Format

```typescript
import { DevToolsOutputFormat } from '@code-pushup/profiler';

const format = new DevToolsOutputFormat('trace.jsonl');

format.preamble({ pid: 123, tid: 456, url: 'app.js' });

const mark = performance.mark('test');
const events = format.encode(mark);

format.epilogue();

format.id;
```
