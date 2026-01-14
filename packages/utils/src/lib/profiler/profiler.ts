import process from 'node:process';
import { isEnvVarEnabled } from '../env.js';
import {
  type MeasureCtxOptions,
  type MeasureOptions,
  asOptions,
  markerPayload,
  measureCtx,
  setupTracks,
} from '../user-timing-extensibility-api-utils.js';
import type {
  ActionTrackEntryPayload,
  DevToolsColor,
  EntryMeta,
} from '../user-timing-extensibility-api.type.js';
import { PROFILER_ENABLED } from './constants.js';

/**
 * Configuration options for creating a Profiler instance.
 *
 * @template T - Record type defining available track names and their configurations
 */
type ProfilerMeasureOptions<T extends Record<string, ActionTrackEntryPayload>> =
  MeasureCtxOptions & {
    /** Custom track configurations that will be merged with default settings */
    tracks?: Record<keyof T, Partial<ActionTrackEntryPayload>>;
    /** Whether profiling should be enabled (defaults to CP_PROFILING env var) */
    enabled?: boolean;
  };

/**
 * Options for configuring a Profiler instance.
 *
 * This is an alias for ProfilerMeasureOptions for backward compatibility.
 *
 * @template T - Record type defining available track names and their configurations
 */
export type ProfilerOptions<
  T extends Record<string, ActionTrackEntryPayload> = Record<
    string,
    ActionTrackEntryPayload
  >,
> = ProfilerMeasureOptions<T>;

/**
 * Performance profiler that creates structured timing measurements with DevTools visualization.
 *
 * This class provides high-level APIs for performance monitoring with automatic DevTools
 * integration for Chrome DevTools Performance panel. It supports both synchronous and
 * asynchronous operations with customizable track visualization.
 *
 */
export class Profiler<T extends Record<string, ActionTrackEntryPayload>> {
  #enabled: boolean;
  private readonly defaults: ActionTrackEntryPayload;
  readonly tracks: Record<keyof T, ActionTrackEntryPayload> | undefined;
  private readonly ctxOf: ReturnType<typeof measureCtx>;

  /**
   * Creates a new Profiler instance with the specified configuration.
   *
   * @param options - Configuration options for the profiler
   * @param options.tracks - Custom track configurations merged with defaults
   * @param options.prefix - Prefix for all measurement names
   * @param options.track - Default track name for measurements
   * @param options.trackGroup - Default track group for organization
   * @param options.color - Default color for track entries
   * @param options.enabled - Whether profiling is enabled (defaults to CP_PROFILING env var)
   *
   */
  constructor(options: ProfilerOptions<T>) {
    const { tracks, prefix, enabled, ...defaults } = options;
    const dataType = 'track-entry';

    this.#enabled = enabled ?? isEnvVarEnabled(PROFILER_ENABLED);
    this.defaults = { ...defaults, dataType };
    this.tracks = tracks
      ? setupTracks({ ...defaults, dataType }, tracks)
      : undefined;
    this.ctxOf = measureCtx({
      ...defaults,
      dataType,
      prefix,
    });
  }

  /**
   * Sets enabled state for this profiler.
   *
   * Also sets the `CP_PROFILING` environment variable.
   * This means any future {@link Profiler} instantiations (including child processes) will use the same enabled state.
   *
   * @param enabled - Whether profiling should be enabled
   */
  setEnabled(enabled: boolean): void {
    process.env[PROFILER_ENABLED] = `${enabled}`;
    this.#enabled = enabled;
  }

  /**
   * Is profiling enabled?
   *
   * Profiling is enabled by {@link setEnabled} call or `CP_PROFILING` environment variable.
   *
   * @returns Whether profiling is currently enabled
   */
  isEnabled(): boolean {
    return this.#enabled;
  }

  /**
   * Creates a performance marker in the DevTools Performance panel.
   *
   * Markers appear as vertical lines spanning all tracks and can include custom metadata
   * for debugging and performance analysis. When profiling is disabled, this method
   * returns immediately without creating any performance entries.
   *
   * @param name - Unique name for the marker
   * @param opt - Metadata and styling for the marker
   * @param opt.color - Color of the marker line (defaults to profiler default)
   * @param opt.tooltipText - Text shown on hover
   * @param opt.properties - Key-value pairs for detailed view
   *
   * @example
   * profiler.marker('user-action-start', {
   *   color: 'primary',
   *   tooltipText: 'User clicked save button',
   *   properties: [
   *     ['action', 'save'],
   *     ['elementId', 'save-btn']
   *   ]
   * });
   */
  marker(name: string, opt?: EntryMeta & { color?: DevToolsColor }) {
    if (!this.#enabled) {
      return;
    }

    performance.mark(
      name,
      asOptions(
        markerPayload({
          // marker only supports color no TrackMeta
          ...(this.defaults.color ? { color: this.defaults.color } : {}),
          ...opt,
        }),
      ),
    );
  }

  /**
   * Measures the execution time of a synchronous operation.
   *
   * Creates start/end marks and a final measure entry in the performance timeline.
   * The operation appears in the configured track with proper DevTools visualization.
   * When profiling is disabled, executes the work function directly without overhead.
   *
   * @template R - The return type of the work function
   * @param event - Name for this measurement event
   * @param work - Function to execute and measure
   * @param options - Measurement configuration overrides
   * @returns The result of the work function
   *
   */
  measure<R>(event: string, work: () => R, options?: MeasureOptions<R>): R {
    if (!this.#enabled) {
      return work();
    }

    const { start, success, error } = this.ctxOf(
      event,
      options as MeasureOptions,
    );
    start();
    try {
      const r = work();
      success(r);
      return r;
    } catch (error_) {
      error(error_);
      throw error_;
    }
  }

  /**
   * Measures the execution time of an asynchronous operation.
   *
   * Creates start/end marks and a final measure entry in the performance timeline.
   * The operation appears in the configured track with proper DevTools visualization.
   * When profiling is disabled, executes and awaits the work function directly without overhead.
   *
   * @template R - The resolved type of the work promise
   * @param event - Name for this measurement event
   * @param work - Function returning a promise to execute and measure
   * @param options - Measurement configuration overrides
   * @returns Promise that resolves to the result of the work function
   *
   */
  async measureAsync<R>(
    event: string,
    work: () => Promise<R>,
    options?: MeasureOptions<R>,
  ): Promise<R> {
    if (!this.#enabled) {
      return await work();
    }

    const { start, success, error } = this.ctxOf(
      event,
      options as MeasureOptions,
    );
    start();
    try {
      const r = work();
      success(r);
      return await r;
    } catch (error_) {
      error(error_);
      throw error_;
    }
  }
}
