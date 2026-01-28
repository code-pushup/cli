# User Timing Profiler

⏱️ **High-performance profiling utility for structured timing measurements with Chrome DevTools Extensibility API payloads.** 📊

---

The `Profiler` class provides a clean, type-safe API for performance monitoring that integrates seamlessly with Chrome DevTools. It supports both synchronous and asynchronous operations with smart defaults for custom track visualization, enabling developers to track performance bottlenecks and optimize application speed.

### Features

- **Type-Safe API**: Fully typed UserTiming API for [Chrome DevTools Extensibility API](https://developer.chrome.com/docs/devtools/performance/extension)
- **Measure API**: Easy-to-use methods for measuring synchronous and asynchronous code execution times.
- **Custom Track Configuration**: Fully typed reusable configurations for custom track visualization.
- **Process buffered entries**: Captures and processes buffered profiling entries.
- **3rd Party Profiling**: Automatically processes third-party performance entries.
- **Clean measure names**: Automatically adds prefixes to measure names, as well as start/end postfix to marks, for better organization.

## Getting started

1. If you haven't already, install [@code-pushup/utils](../../README.md).

2. Install as a dependency with your package manager:

   ```sh
   npm install @code-pushup/utils
   ```

   ```sh
   yarn add @code-pushup/utils
   ```

   ```sh
   pnpm add @code-pushup/utils
   ```

3. Import and create a profiler instance:

   ```ts
   import { Profiler } from '@code-pushup/utils';

   const profiler = new Profiler({
     prefix: 'cp',
     track: 'CLI',
     trackGroup: 'Code Pushup',
     color: 'primary-dark',
     tracks: {
       utils: { track: 'Utils', color: 'primary' },
       core: { track: 'Core', color: 'primary-light' },
     },
     enabled: true,
   });
   ```

4. Start measuring performance:

   ```ts
   // Measure synchronous operations
   const result = profiler.measure('data-processing', () => {
     return processData(data);
   });

   // Measure asynchronous operations
   const asyncResult = await profiler.measureAsync('api-call', async () => {
     return await fetch('/api/data').then(r => r.json());
   });
   ```

## Configuration

```ts
new Profiler<T>(options: ProfilerOptions<T>)
```

**Parameters:**

- `options` - Configuration options for the profiler instance

**Options:**

| Property     | Type      | Default     | Description                                                     |
| ------------ | --------- | ----------- | --------------------------------------------------------------- |
| `tracks`     | `object`  | `undefined` | Custom track configurations merged with defaults                |
| `prefix`     | `string`  | `undefined` | Prefix for all measurement names                                |
| `track`      | `string`  | `undefined` | Default track name for measurements                             |
| `trackGroup` | `string`  | `undefined` | Default track group for organization                            |
| `color`      | `string`  | `undefined` | Default color for track entries                                 |
| `enabled`    | `boolean` | `env var`   | Whether profiling is enabled (defaults to CP_PROFILING env var) |

### Environment Variables

- `CP_PROFILING` - Enables or disables profiling globally (boolean)

```bash
# Enable profiling in development
CP_PROFILING=true npm run dev

# Disable profiling in production
CP_PROFILING=false npm run build
```

## API Methods

The profiler provides several methods for different types of performance measurements:

| Method                                                                                            | Description                                                                                             |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `measure<R>(event: string, work: () => R, options?: MeasureOptions<R>): R`                        | Measures synchronous operation execution time with DevTools payloads. Noop when profiling is disabled.  |
| `measureAsync<R>(event: string, work: () => Promise<R>, options?: MeasureOptions<R>): Promise<R>` | Measures asynchronous operation execution time with DevTools payloads. Noop when profiling is disabled. |
| `marker(name: string, opt?: MarkerOptions): void`                                                 | Creates performance markers as vertical lines in DevTools timeline. Noop when profiling is disabled.    |
| `setEnabled(enabled: boolean): void`                                                              | Controls profiling at runtime.                                                                          |
| `isEnabled(): boolean`                                                                            | Returns whether profiling is currently enabled.                                                         |

### Synchronous measurements

```ts
profiler.measure<R>(event: string, work: () => R, options?: MeasureOptions<R>): R
```

Measures the execution time of a synchronous operation. Creates performance start/end marks and a final measure with Chrome DevTools Extensibility API payloads.

```ts
const result = profiler.measure(
  'file-processing',
  () => {
    return fs.readFileSync('large-file.txt', 'utf8');
  },
  {
    track: 'io-operations',
    color: 'warning',
  },
);
```

### Asynchronous measurements

```ts
profiler.measureAsync<R>(event: string, work: () => Promise<R>, options?: MeasureOptions<R>): Promise<R>
```

Measures the execution time of an asynchronous operation.

```ts
const data = await profiler.measureAsync(
  'api-request',
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    track: 'network',
    trackGroup: 'external',
  },
);
```

### Performance markers

```ts
profiler.marker(name: string, options?: EntryMeta & { color?: DevToolsColor }): void
```

Creates a performance mark with Chrome DevTools marker visualization. Markers appear as vertical lines spanning all tracks and can include custom metadata.

```ts
profiler.marker('user-action', {
  color: 'secondary',
  tooltipText: 'User clicked save button',
  properties: [
    ['action', 'save'],
    ['elementId', 'save-btn'],
  ],
});
```

### Runtime control

```ts
profiler.setEnabled(enabled: boolean): void
profiler.isEnabled(): boolean
```

Control profiling at runtime and check current status.

```ts
// Disable profiling temporarily
profiler.setEnabled(false);

// Check if profiling is active
if (profiler.isEnabled()) {
  console.log('Performance monitoring is active');
}
```

## Examples

### Basic usage

```ts
import { Profiler } from '@code-pushup/utils';

const profiler = new Profiler({
  prefix: 'cp',
  track: 'CLI',
  trackGroup: 'Code Pushup',
  color: 'primary-dark',
  tracks: {
    utils: { track: 'Utils', color: 'primary' },
    core: { track: 'Core', color: 'primary-light' },
  },
  enabled: true,
});

// Simple measurement
const result = profiler.measure('data-transform', () => {
  return transformData(input);
});

// Async measurement with custom options
const data = await profiler.measureAsync(
  'fetch-user',
  async () => {
    return await api.getUser(userId);
  },
  {
    track: 'api',
    color: 'info',
  },
);

// Add a marker for important events
profiler.marker('user-login', {
  tooltipText: 'User authentication completed',
});
```

### Custom tracks

Define custom track configurations for better organization:

```ts
interface AppTracks {
  api: ActionTrackEntryPayload;
  db: ActionTrackEntryPayload;
  cache: ActionTrackEntryPayload;
}

const profiler = new Profiler<AppTracks>({
  track: 'API',
  trackGroup: 'Server',
  color: 'primary-dark',
  tracks: {
    api: { color: 'primary' },
    db: { track: 'database', color: 'warning' },
    cache: { track: 'cache', color: 'success' },
  },
});

// Use predefined tracks
const users = await profiler.measureAsync('fetch-users', fetchUsers, profiler.tracks.api);

const saved = profiler.measure('save-user', () => saveToDb(user), {
  ...profiler.tracks.db,
  color: 'primary',
});
```

## NodeJSProfiler

### Features

- **Crash-safe Write Ahead Log**: Ensures profiling data is saved even if the application crashes.
- **Recoverable Profiles**: Ability to resume profiling sessions after interruptions or crash.
- **Automatic Trace Generation**: Generates trace files compatible with Chrome DevTools for in-depth performance analysis.
- **Multiprocess Support**: Designed to handle profiling over sharded WAL.
- **Controllable over env vars**: Easily enable or disable profiling through environment variables.

This profiler extends all options and API from Profiler with automatic process exit handling for buffered performance data.

The NodeJSProfiler automatically subscribes to performance observation and installs exit handlers that flush buffered data on process termination (signals, fatal errors, or normal exit).

### Exit Handlers

The profiler automatically subscribes to process events (`exit`, `SIGINT`, `SIGTERM`, `SIGQUIT`, `uncaughtException`, `unhandledRejection`) during construction. When any of these occur, the handlers call `close()` to ensure buffered data is flushed.

The `close()` method is idempotent and safe to call from exit handlers. It unsubscribes from exit handlers, closes the WAL sink, and unsubscribes from the performance observer, ensuring all buffered performance data is written before process termination.

## Configuration

```ts
new NodejsProfiler<DomainEvents, Tracks>(options: NodejsProfilerOptions<DomainEvents, Tracks>)
```

**Parameters:**

- `options` - Configuration options for the profiler instance

**Options:**

| Property                 | Type                                    | Default          | Description                                                                          |
| ------------------------ | --------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `format`                 | `Partial<WalFormat<DomainEvents>>`      | _required_       | WAL format configuration for sharded write-ahead logging                             |
| `measureName`            | `string`                                | _auto-generated_ | Optional folder name for sharding. If not provided, a new group ID will be generated |
| `outDir`                 | `string`                                | `'tmp/profiles'` | Output directory for WAL shards and final files                                      |
| `outBaseName`            | `string`                                | _optional_       | Override the base name for WAL files (overrides format.baseName)                     |
| `encodePerfEntry`        | `PerformanceEntryEncoder<DomainEvents>` | _required_       | Function that encodes raw PerformanceEntry objects into domain-specific types        |
| `captureBufferedEntries` | `boolean`                               | `true`           | Whether to capture performance entries that occurred before observation started      |
| `flushThreshold`         | `number`                                | `20`             | Threshold for triggering queue flushes based on queue length                         |
| `maxQueueSize`           | `number`                                | `10_000`         | Maximum number of items allowed in the queue before new entries are dropped          |

## API Methods

The NodeJSProfiler inherits all API methods from the base Profiler class and adds additional methods for queue management and WAL lifecycle control.

| Method                               | Description                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `getStats()`                         | Returns comprehensive queue statistics for monitoring and debugging.            |
| `flush()`                            | Forces immediate writing of all queued performance entries to the WAL.          |
| `setEnabled(enabled: boolean): void` | Controls profiling at runtime with automatic WAL/observer lifecycle management. |

### Runtime control with Write Ahead Log lifecycle management

```ts
profiler.setEnabled(enabled: boolean): void
```

Controls profiling at runtime and manages the WAL/observer lifecycle. Unlike the base Profiler class, this method ensures that when profiling is enabled, the WAL is opened and the performance observer is subscribed. When disabled, the WAL is closed and the observer is unsubscribed.

```ts
// Temporarily disable profiling to reduce overhead during heavy operations
profiler.setEnabled(false);
await performHeavyOperation();
profiler.setEnabled(true); // WAL reopens and observer resubscribes
```

### Queue statistics

```ts
profiler.getStats(): {
  enabled: boolean;
  observing: boolean;
  walOpen: boolean;
  isSubscribed: boolean;
  queued: number;
  dropped: number;
  written: number;
  maxQueueSize: number;
  flushThreshold: number;
  addedSinceLastFlush: number;
  buffered: boolean;
}
```

Returns comprehensive queue statistics for monitoring and debugging. Provides insight into the current state of the performance entry queue, useful for monitoring memory usage and processing throughput.

```ts
const stats = profiler.getStats();
console.log(`Enabled: ${stats.enabled}, WAL Open: ${stats.walOpen}, Observing: ${stats.observing}, Subscribed: ${stats.isSubscribed}, Queued: ${stats.queued}`);
if (stats.enabled && stats.walOpen && stats.observing && stats.isSubscribed && stats.queued > stats.flushThreshold) {
  console.log('Queue nearing capacity, consider manual flush');
}
```

### Manual flushing

```ts
profiler.flush(): void
```

Forces immediate writing of all queued performance entries to the write ahead log, ensuring no performance data is lost. This method is useful for manual control over when buffered data is written, complementing the automatic flushing that occurs during process exit or when thresholds are reached.

```ts
// Flush periodically in long-running applications to prevent memory buildup
setInterval(() => {
  profiler.flush();
}, 60000); // Flush every minute

// Ensure all measurements are saved before critical operations
await profiler.measureAsync('database-migration', async () => {
  await runMigration();
  profiler.flush(); // Ensure migration timing is recorded immediately
});
```

## Resources

- **[Chrome DevTools Extensibility API](https://developer.chrome.com/docs/devtools/performance/extension)** - Official documentation for performance profiling
- **[User Timing API](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API)** - Web Performance API reference
