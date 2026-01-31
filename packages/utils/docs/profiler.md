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

### Profiler Lifecycle States

The NodeJSProfiler follows a state machine with three distinct states:

**State Machine Flow**

```
idle ⇄ running
  ↓       ↓
  └──→ closed
```

- **idle**: Profiler is initialized but not actively collecting measurements. WAL sink is closed and performance observer is unsubscribed.
- **running**: Profiler is actively collecting performance measurements. WAL sink is open and performance observer is subscribed.
- **closed**: Profiler has been closed and all buffered data has been flushed to disk. Resources have been fully released. This state is irreversible.

**State Transitions:**

- `idle` → `running`: Occurs when `setEnabled(true)` is called. Enables profiling, opens WAL sink, and subscribes to performance observer.
- `running` → `idle`: Occurs when `setEnabled(false)` is called. Disables profiling, unsubscribes from performance observer, and closes WAL sink (sink will be reopened on re-enable).
- `running` → `closed`: Occurs when `close()` is called. Disables profiling, unsubscribes, closes sink, finalizes shards, and unsubscribes exit handlers (irreversible).
- `idle` → `closed`: Occurs when `close()` is called. Closes sink if it was opened, finalizes shards, and unsubscribes exit handlers (irreversible).

Once a state transition to `closed` occurs, there are no transitions back to previous states. This ensures data integrity and prevents resource leaks.

## Configuration

```ts
new NodejsProfiler<DomainEvents, Tracks>(options: NodejsProfilerOptions<DomainEvents, Tracks>)
```

**Parameters:**

- `options` - Configuration options for the profiler instance

**Options:**

| Property                 | Type                                    | Default          | Description                                                                           |
| ------------------------ | --------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `format`                 | `ProfilerFormat<DomainEvents>`          | _required_       | WAL format configuration for sharded write-ahead logging, including `encodePerfEntry` |
| `measureName`            | `string`                                | _auto-generated_ | Optional folder name for sharding. If not provided, a new group ID will be generated  |
| `outDir`                 | `string`                                | `'tmp/profiles'` | Output directory for WAL shards and final files                                       |
| `outBaseName`            | `string`                                | _optional_       | Override the base name for WAL files (overrides format.baseName)                      |
| `format.encodePerfEntry` | `PerformanceEntryEncoder<DomainEvents>` | _required_       | Function that encodes raw PerformanceEntry objects into domain-specific types         |
| `captureBufferedEntries` | `boolean`                               | `true`           | Whether to capture performance entries that occurred before observation started       |
| `flushThreshold`         | `number`                                | `20`             | Threshold for triggering queue flushes based on queue length                          |
| `maxQueueSize`           | `number`                                | `10_000`         | Maximum number of items allowed in the queue before new entries are dropped           |

### Environment Variables

The NodeJSProfiler can be configured using environment variables, which override the corresponding options when not explicitly provided:

| Environment Variable       | Type     | Default          | Description                                                                                                                        |
| -------------------------- | -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `CP_PROFILING`             | `string` | _unset_          | Enables or disables profiling globally. Set to `'true'` to enable, `'false'` or unset to disable.                                  |
| `DEBUG`                    | `string` | _unset_          | Enables debug mode for profiler state transitions. When set to `'true'`, state transitions create performance marks for debugging. |
| `CP_PROFILER_OUT_DIR`      | `string` | `'tmp/profiles'` | Output directory for WAL shards and final files. Overrides the `outDir` option.                                                    |
| `CP_PROFILER_MEASURE_NAME` | `string` | _auto-generated_ | Measure name used for sharding. Overrides the `measureName` option. If not provided, a new group ID will be generated.             |

```bash
# Enable profiling with custom output directory
CP_PROFILING=true CP_PROFILER_OUT_DIR=/path/to/profiles npm run dev

# Enable profiling with debug mode and custom measure name
CP_PROFILING=true DEBUG=true CP_PROFILER_MEASURE_NAME=my-measure npm run dev
```

## API Methods

The NodeJSProfiler inherits all API methods from the base Profiler class and adds additional methods for queue management and WAL lifecycle control.

| Method                               | Description                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | --------- | ----------- |
| `stats`                              | Returns comprehensive queue statistics and profiling state for monitoring and debugging. |
| `state`                              | Returns current profiler state (`'idle'                                                  | 'running' | 'closed'`). |
| `close()`                            | Closes profiler and releases resources. Idempotent, safe for exit handlers.              |
| `flush()`                            | Forces immediate writing of all queued performance entries to the WAL.                   |
| `setEnabled(enabled: boolean): void` | Controls profiling at runtime with automatic WAL/observer lifecycle management.          |

### Profiler state

```ts
profiler.state: 'idle' | 'running' | 'closed'
```

Returns the current profiler state. Use this to check the profiler's lifecycle state without accessing the full stats object.

```ts
// Check current state
if (profiler.state === 'running') {
  console.log('Profiler is actively collecting measurements');
} else if (profiler.state === 'idle') {
  console.log('Profiler is initialized but not collecting');
} else {
  console.log('Profiler has been closed');
}
```

### Closing the profiler

```ts
profiler.close(): void
```

Closes profiler and releases resources. This method is idempotent and safe to call from exit handlers. When called, it transitions the profiler to the `closed` state, which is irreversible. All buffered data is flushed, shards are finalized, and exit handlers are unsubscribed.

```ts
// Close profiler when done
profiler.close();

// Safe to call multiple times (idempotent)
profiler.close(); // No-op if already closed

// Check if closed
if (profiler.state === 'closed') {
  console.log('Profiler resources have been released');
}
```

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

### Profiler statistics

```ts
profiler.stats: {
  profilerState: 'idle' | 'running' | 'closed';
  debug: boolean;
  sharderState: 'active' | 'finalized' | 'cleaned';
  shardCount: number;
  groupId: string;
  isCoordinator: boolean;
  isFinalized: boolean;
  isCleaned: boolean;
  finalFilePath: string;
  shardFileCount: number;
  shardFiles: string[];
  shardOpen: boolean;
  shardPath: string;
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
