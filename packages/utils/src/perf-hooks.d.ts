import type { DetailPayloadWithDevtools } from './lib/user-timing-extensibility-api.type';

export {};

/**
 * Type definitions extending Node.js perf_hooks module to enable Chrome DevTools UserTiming Extensibility API.
 *
 * The `detail` property allows custom payloads to be attached to performance marks and measures,
 * which are then accessible in Chrome DevTools and visualized in as custom tracks right under UserTiming.
 * This enables richer performance instrumentation with structured data that DevTools can display.
 */
declare module 'node:perf_hooks' {
  /**
   * Extends the base PerformanceEntry interface with optional custom detail payload.
   *
   * The detail property enables Chrome DevTools UserTiming Extensibility API by allowing
   * structured data to be attached to performance entries for enhanced debugging visualization.
   * This augmentation only ensures the payload is preserved and visible to DevTools.
   *
   * @example
   * ```typescript
   * // Preserved entries with entry.detail
   * const entry = performance.getEntriesByType('mark').at(0);
   * ```
   */
  interface PerformanceEntry {
    /** Custom payload accessible in Chrome DevTools for enhanced performance analysis. */
    readonly detail?: DetailPayloadWithDevtools;
  }

  /**
   * Represents a performance mark entry with custom detail support for DevTools extensibility.
   *
   * Mark entries with detail payloads enable Chrome DevTools to display additional context
   * and structured data alongside the mark in the Performance tab. Markers create vertical
   * lines that span all tracks and appear at the top of the timeline.
   *
   * @example
   * ```typescript
   * // Preserved mark entries with entry.detail
   * const entry = performance.getEntriesByType('mark').at(0);
   * ```
   */
  interface MarkEntry extends PerformanceMark {
    readonly entryType: 'mark';
    /** Custom payload displayed in Chrome DevTools for enhanced mark visualization. */
    readonly detail?: DetailPayloadWithDevtools;
  }

  /**
   * Represents a performance measure entry with custom detail support for DevTools extensibility.
   *
   * Measure entries with detail payloads allow Chrome DevTools to show additional metadata
   * and context information alongside the measured performance duration. Track entries appear
   * in custom tracks below the main UserTiming track.
   *
   * @example
   * ```typescript
   * // Preserved measure entries with entry.detail
   * const entry = performance.getEntriesByType('measure').at(0);
   * ```
   */
  interface MeasureEntry extends PerformanceMeasure {
    readonly entryType: 'measure';
    /** Custom payload displayed in Chrome DevTools for enhanced measure visualization. */
    readonly detail?: DetailPayloadWithDevtools;
  }

  /**
   * Extends Node.js PerformanceMark to include the custom detail payload support.
   *
   * This interface ensures that performance marks created through the extended API
   * have access to the `detail` property for Chrome DevTools UserTiming Extensibility.
   */
  interface PerformanceMark extends PerformanceEntry {}

  /**
   * Extends Node.js PerformanceMeasure to include the custom detail payload support.
   *
   * This interface ensures that performance measures created through the extended API
   * have access to the `detail` property for Chrome DevTools UserTiming Extensibility.
   */
  interface PerformanceMeasure extends PerformanceEntry {}

  /**
   * Options for creating performance marks with custom detail payload for DevTools integration.
   *
   * The detail property enables attaching structured data that Chrome DevTools can display
   * alongside the mark, providing richer debugging context.
   *
   * @example
   * ```typescript
   * // Options include detail property
   * const options: PerformanceMarkOptions = { detail: { devtools: {} } };
   * ```
   */
  export interface PerformanceMarkOptions {
    /** Custom payload that will be accessible in Chrome DevTools UserTiming visualization. */
    detail?: DetailPayloadWithDevtools;
    startTime?: DOMHighResTimeStamp;
  }

  /**
   * Options for creating performance measures with custom detail payload for DevTools integration.
   *
   * The detail property allows attaching metadata that Chrome DevTools will display
   * with the measure, enabling better performance analysis and debugging.
   *
   * @example
   * ```typescript
   * // Options include detail property
   * const options: PerformanceMeasureOptions = { detail: { devtools: {} } };
   * ```
   */
  export interface PerformanceMeasureOptions {
    /** Custom payload that will be accessible in Chrome DevTools UserTiming visualization. */
    detail?: DetailPayloadWithDevtools;
    start?: string | number;
    end?: string | number;
    duration?: number;
  }

  /**
   * Extended performance observer entry list with typed entry retrieval.
   */
  export interface PerformanceObserverEntryList {
    getEntriesByType: (type: EntryType) => PerformanceEntry[];
  }

  /**
   * Extended performance object with Chrome DevTools UserTiming Extensibility API support.
   *
   * Enables creating performance marks and measures with custom detail payloads that are
   * displayed in Chrome DevTools, providing enhanced debugging and performance analysis capabilities.
   */
  const performance: {
    /**
     * Creates a performance mark with optional custom detail payload for DevTools visualization.
     *
     * The detail payload will be accessible in Chrome DevTools Performance tab,
     * enabling richer debugging context for the mark.
     *
     * @example
     * ```typescript
     * // Accepts detail options
     * performance.mark('checkpoint', { detail: { devtools: {} } });
     * ```
     *
     * @param name - The name of the mark displayed in DevTools
     * @param options - Optional configuration including detail payload for DevTools
     * @returns The created performance mark with DevTools-compatible detail
     */
    mark: (name: string, options?: PerformanceMarkOptions) => PerformanceMark;

    /**
     * Creates a performance measure with optional custom detail payload for DevTools visualization.
     *
     * The detail payload enables Chrome DevTools to display additional metadata
     * alongside the measured performance duration for enhanced analysis.
     *
     * @example
     * ```typescript
     * // Accepts detail options
     * performance.measure('task', { detail: { devtools: {} } });
     * ```
     *
     * @param name - The name of the measure displayed in DevTools
     * @param startOrOptions - Start mark name/number or full options object with DevTools detail
     * @param end - End mark name/number (when startOrOptions is not options object)
     * @returns The created performance measure with DevTools-compatible detail
     */
    measure: (
      name: string,
      startOrOptions?: string | number | PerformanceMeasureOptions,
      end?: string | number,
    ) => PerformanceMeasure;

    /**
     * Retrieves performance entries of the specified type, including DevTools detail payloads.
     *
     * @example
     * ```typescript
     * // Returns entries with preserved entry.detail
     * const entry = performance.getEntriesByType('mark').at(0);
     * ```
     *
     * @param type - The entry type to filter by ('mark' or 'measure')
     * @returns Array of performance entries with DevTools detail payloads
     */
    getEntriesByType: (type: EntryType) => PerformanceEntry[];
  };
}
