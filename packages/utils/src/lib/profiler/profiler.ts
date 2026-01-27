import process from 'node:process';
import { threadId } from 'node:worker_threads';
import { isEnvVarEnabled } from '../env.js';
import { subscribeProcessExit } from '../exit-process.js';
import {
  type ActionTrackConfigs,
  type MeasureCtxOptions,
  type MeasureOptions,
  asOptions,
  errorToMarkerPayload,
  markerPayload,
  measureCtx,
  setupTracks,
} from '../user-timing-extensibility-api-utils.js';
import type {
  ActionTrackEntryPayload,
  DevToolsColor,
  EntryMeta,
} from '../user-timing-extensibility-api.type.js';
import { PROFILER_ENABLED_ENV_VAR } from './constants.js';
import { type TraceEvent } from './trace-file.type.js';

/**
 * Generates a unique profiler ID based on performance time origin, process ID, thread ID, and instance count.
 */
export function getProfilerId() {
  // eslint-disable-next-line functional/immutable-data
  return `${Math.round(performance.timeOrigin)}.${process.pid}.${threadId}.${++Profiler.instanceCount}`;
}

/**
 * Configuration options for creating a Profiler instance.
 *
 * @template T - Record type defining available track names and their configurations
 */
type ProfilerMeasureOptions<T extends ActionTrackConfigs> =
  MeasureCtxOptions & {
    /** Custom track configurations that will be merged with default settings */
    tracks?: Record<keyof T, Partial<ActionTrackEntryPayload>>;
    /** Whether profiling should be enabled (defaults to CP_PROFILING env var) */
    enabled?: boolean;
  };

/**
 * Options for creating a performance marker.
 */
export type MarkerOptions = EntryMeta & { color?: DevToolsColor };

/**
 * Options for configuring a Profiler instance.
 *
 * This is an alias for ProfilerMeasureOptions for backward compatibility.
 *
 * @template T - Record type defining available track names and their configurations
 *
 * @property enabled - Whether profiling is enabled (defaults to CP_PROFILING env var)
 * @property prefix - Prefix for all measurement names
 * @property track - Default track name for measurements
 * @property trackGroup - Default track group for organization
 * @property color - Default color for track entries
 * @property tracks - Custom track configurations merged with defaults
 */
export type ProfilerOptions<T extends ActionTrackConfigs = ActionTrackConfigs> =
  ProfilerMeasureOptions<T>;

/**
 * Performance profiler that creates structured timing measurements with Chrome DevTools Extensibility API payloads.
 *
 * This class provides high-level APIs for performance monitoring focused on Chrome DevTools Extensibility API data.
 * It supports both synchronous and asynchronous operations with all having smart defaults for custom track data.
 *
 */
export class Profiler<T extends ActionTrackConfigs> {
  static instanceCount = 0;
  readonly id = getProfilerId();
  #enabled: boolean;
  readonly #defaults: ActionTrackEntryPayload;
  readonly tracks: Record<keyof T, ActionTrackEntryPayload> | undefined;
  readonly #ctxOf: ReturnType<typeof measureCtx>;

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

    this.#enabled = enabled ?? isEnvVarEnabled(PROFILER_ENABLED_ENV_VAR);
    this.#defaults = { ...defaults, dataType };
    this.tracks = tracks
      ? setupTracks({ ...defaults, dataType }, tracks)
      : undefined;
    this.#ctxOf = measureCtx({
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
    process.env[PROFILER_ENABLED_ENV_VAR] = `${enabled}`;
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
   * Creates a performance mark including payload for a Chrome DevTools 'marker' item.
   *
   * Markers appear as vertical lines spanning all tracks and can include custom metadata
   * for debugging and performance analysis. When profiling is disabled, this method
   * returns immediately without creating any performance entries.
   *
   * @param name - Unique name for the marker
   * @param opt - Metadata and styling for the marker
   * @param opt.color - Color of the marker line (defaults to profiler default)
   * @param opt.tooltipText - Text shown on hover
   * @param opt.properties - Key-value pairs for detailed view show on click
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
  marker(name: string, opt?: MarkerOptions): void {
    if (!this.#enabled) {
      return;
    }

    performance.mark(
      name,
      asOptions(
        markerPayload({
          // marker only takes default color, no TrackMeta
          ...(this.#defaults.color ? { color: this.#defaults.color } : {}),
          ...opt,
        }),
      ),
    );
  }

  /**
   * Measures the execution time of a synchronous operation.
   *
   * For asynchronous operations, use the {@link measureAsync} method.
   *
   * Creates performance start/end marks and a final measure.
   * All entries have Chrome DevTools Extensibility API payload and are visualized under custom tracks.
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

    const { start, success, error } = this.#ctxOf(event, options);
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
   * For synchronous operations, use the {@link measure} method.
   *
   * Creates performance start/end marks and a final measure.
   * All entries have Chrome DevTools Extensibility API payload and are visualized under custom tracks.
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

    const { start, success, error } = this.#ctxOf(event, options);
    start();
    try {
      const r = await work();
      success(r);
      return r;
    } catch (error_) {
      error(error_);
      throw error_;
    }
  }
}

// @TODO implement ShardedWAL
type WalSink = {
  append: (event: TraceEvent) => void;
  open: () => void;
  close: () => void;
  isClosed: () => boolean;
};

export type NodeJsProfilerOptions<T extends ActionTrackConfigs> =
  ProfilerOptions<T> & {
    // @TODO implement WALFormat
    format: {
      encode: (v: string | object) => string;
    };
  };

export class NodeJsProfiler<T extends ActionTrackConfigs> extends Profiler<T> {
  #exitHandlerSubscription: null | (() => void) = null;
  protected sink: WalSink | null = null;

  constructor(options: NodeJsProfilerOptions<T>) {
    super(options);
    // Temporary dummy sink; replaced by real WAL implementation
    this.sink = {
      append: event => {
        options.format.encode(event);
      },
      open: () => void 0,
      close: () => void 0,
      isClosed: () => false,
    };
    this.#exitHandlerSubscription = this.subscribeProcessExit();
  }

  /**
   * Installs process exit and error handlers to ensure proper cleanup of profiling resources.
   *
   * When an error occurs or the process exits, this automatically creates a fatal error marker
   * and shuts down the profiler gracefully, ensuring all buffered data is flushed.
   *
   * @protected
   */
  protected subscribeProcessExit(): () => void {
    return subscribeProcessExit({
      onError: (err, kind) => {
        if (!super.isEnabled()) {
          return;
        }
        this.marker('Fatal Error', {
          ...errorToMarkerPayload(err),
          tooltipText: `${kind} caused fatal error`,
        });
        this.close();
      },
      onExit: (code, reason) => {
        if (!super.isEnabled()) {
          return;
        }
        this.marker('Process Exit', {
          ...(code === 0 ? {} : { color: 'warning' }),
          properties: [['reason', JSON.stringify(reason)]],
          tooltipText: `Process exited with code ${code}`,
        });
        this.close();
      },
    });
  }

  /**
   * Closes the profiler and releases all associated resources.
   * Profiling is finished forever for this instance.
   *
   * This method should be called when profiling is complete to ensure all buffered
   * data is flushed and the WAL sink is properly closed.
   */
  close(): void {
    if (!this.isEnabled()) {
      return;
    }
    this.setEnabled(false);
    this.#exitHandlerSubscription?.();
    this.#exitHandlerSubscription = null;
    this.sink?.close();
  }
}
