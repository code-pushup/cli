# Profile

The `Profiler` class provides a clean, type-safe API for performance monitoring that integrates seamlessly with Chrome DevTools. It supports both synchronous and asynchronous operations with smart defaults for custom track visualization, enabling developers to track performance bottlenecks and optimize application speed.

## Features

- **Type-Safe API**: Fully typed UserTiming API for [Chrome DevTools Extensibility API](https://developer.chrome.com/docs/devtools/performance/extension)
- **Measure API**: Easy-to-use methods for measuring synchronous and asynchronous code execution times.
- **Custom Track Configuration**: Fully typed reusable configurations for custom track visualization.
- **Process buffered entries**: Captures and processes buffered profiling entries.
- **3rd Party Profiling**: Automatically processes third-party performance entries.
- **Clean measure names**: Automatically adds prefixes to measure names, as well as start/end postfix to marks, for better organization.

## NodeJS Features

- **Crash-save Write Ahead Log**: Ensures profiling data is saved even if the application crashes.
- **Recoverable Profiles**: Ability to resume profiling sessions after interruptions or crash.
- **Automatic Trace Generation**: Generates trace files compatible with Chrome DevTools for in-depth performance analysis.
- **Multiprocess Support**: Designed to handle profiling over sharded WAL.
- **Controllable over env vars**: Easily enable or disable profiling through environment variables.
