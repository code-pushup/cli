# User Timing Profiler

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Futils.svg)](https://www.npmjs.com/package/@code-pushup/utils)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Futils)](https://npmtrends.com/@code-pushup/utils)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/utils)](https://www.npmjs.com/package/@code-pushup/utils?activeTab=dependencies)

⏱️ **High-performance profiling utility for structured timing measurements with Chrome DevTools Extensibility API payloads.** 📊

---

The `Profiler` class provides a clean, type-safe API for performance monitoring that integrates seamlessly with Chrome DevTools. It supports both synchronous and asynchronous operations with smart defaults for custom track visualization, enabling developers to track performance bottlenecks and optimize application speed.

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
  tracks: {
    api: { track: 'api', trackGroup: 'network', color: 'primary' },
    db: { track: 'database', trackGroup: 'data', color: 'warning' },
    cache: { track: 'cache', trackGroup: 'data', color: 'success' },
  },
});

// Use predefined tracks
const users = await profiler.measureAsync('fetch-users', fetchUsers, {
  track: 'api',
});

const saved = profiler.measure('save-user', () => saveToDb(user), {
  track: 'db',
});
```

## Resources

- **[Chrome DevTools Extensibility API](https://developer.chrome.com/docs/devtools/performance/extension)** - Official documentation for performance profiling
- **[User Timing API](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API)** - Web Performance API reference
