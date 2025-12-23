// extensibility-api.perf_hooks.patch.d.ts
// Type augmentation for the perf_hooks monkey patch.
import 'node:perf_hooks';

declare global {
  interface PerfHooksPatchedHookContext {
    pid: number;
    tid: number;
    name: string;

    // mark-specific
    options?: PerformanceMarkOptions;

    // measure-specific (keep broad)
    startOrOptions?: unknown;
    endOrOptions?: unknown;
  }
}

/*declare module 'node:perf_hooks' {
  interface Performance {}
}*/

export {};
