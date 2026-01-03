/// <reference types="node" />
import type {
  MarkOptionsWith,
  MeasureOptionsWith,
} from './lib/user-timing-details.type';

/**
 * Type declarations to extend Node.js performance hooks with DevTools options.
 *
 * This provides autocomplete and type safety when using performance.mark() and performance.measure()
 * with custom DevTools metadata for Chrome DevTools visualization.
 *
 * Usage:
 * ```typescript
 * import '@code-pushup/profiler/perf_hooks'; // Import this file to extend performance types
 *
 * // Now performance.mark and performance.measure have DevTools-aware overloads
 * performance.mark('my-mark', {
 *   detail: {
 *     devtools: {
 *       dataType: 'marker',
 *       color: 'primary',
 *       tooltipText: 'My custom mark'
 *     }
 *   }
 * });
 * ```
 */

// Extend the global Performance interface
declare global {
  interface Performance {
    /**
     * Creates a performance mark with DevTools metadata support.
     * Extends the standard performance.mark() with DevTools visualization options.
     */
    mark(name: string, options?: MarkOptionsWith): PerformanceMark;

    /**
     * Creates a performance measure with DevTools metadata support.
     * Extends the standard performance.measure() with DevTools visualization options.
     */
    measure(
      name: string,
      startMark?: string,
      endMark?: string,
    ): PerformanceMeasure;
    measure(name: string, options?: MeasureOptionsWith): PerformanceMeasure;
  }
}

// Re-export the types for convenience
export type {
  MarkOptionsWith,
  MeasureOptionsWith,
} from './lib/user-timing-details.type';
