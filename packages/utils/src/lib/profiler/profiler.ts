import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import { isEnvVarEnabled } from '../env.js';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from '../performance-observer.js';
import { objectToEntries } from '../transform.js';
import {
  type ActionTrackConfigs,
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
  MarkerPayload,
} from '../user-timing-extensibility-api.type.js';
import type { AppendableSink } from '../wal.js';
import {
  PROFILER_DEBUG_ENV_VAR,
  PROFILER_ENABLED_ENV_VAR,
} from './constants.js';

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
  #enabled: boolean = false;
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
    if (!this.isEnabled()) {
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
    if (!this.isEnabled()) {
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
    if (!this.isEnabled()) {
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

/**
 * Options for configuring a NodejsProfiler instance.
 *
 * Extends ProfilerOptions with a required sink parameter.
 *
 * @template Tracks - Record type defining available track names and their configurations
 */
export type NodejsProfilerOptions<
  DomainEvents,
  Tracks extends Record<string, ActionTrackEntryPayload>,
> = ProfilerOptions<Tracks> &
  Omit<PerformanceObserverOptions<DomainEvents>, 'sink'> & {
    /**
     * Sink for buffering and flushing performance data
     **/
    sink: AppendableSink<DomainEvents>;

    /**
     * Name of the environment variable to check for debug mode.
     * When the env var is set to 'true', profiler state transitions create performance marks for debugging.
     *
     * @default 'CP_PROFILER_DEBUG'
     */
    debugEnvVar?: string;
  };

/**
 * Performance profiler with automatic process exit handling for buffered performance data.
 *
 * This class extends the base {@link Profiler} with automatic flushing of performance data
 * when the process exits. It accepts a {@link PerformanceObserverSink} that buffers performance
 * entries and ensures they are written out during process termination, even for unexpected exits.
 *
 * The sink defines the output format for performance data, enabling flexible serialization
 * to various formats such as DevTools TraceEvent JSON, OpenTelemetry protocol buffers,
 * or custom domain-specific formats.
 *
 * The profiler automatically subscribes to the performance observer when enabled and installs
 * exit handlers that flush buffered data on process termination (signals, fatal errors, or normal exit).
 *
 */
export class NodejsProfiler<
  DomainEvents,
  Tracks extends Record<string, ActionTrackEntryPayload> = Record<
    string,
    ActionTrackEntryPayload
  >,
> extends Profiler<Tracks> {
  #sink: AppendableSink<DomainEvents>;
  #performanceObserverSink: PerformanceObserverSink<DomainEvents>;
  #state: 'idle' | 'running' | 'closed' = 'idle';
  #debug: boolean;

  /**
   * Creates a NodejsProfiler instance.
   * @param options - Configuration with required sink
   */
  constructor(options: NodejsProfilerOptions<DomainEvents, Tracks>) {
    const {
      sink,
      encodePerfEntry,
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
      enabled,
      debugEnvVar = PROFILER_DEBUG_ENV_VAR,
      ...profilerOptions
    } = options;
    const initialEnabled = enabled ?? isEnvVarEnabled(PROFILER_ENABLED_ENV_VAR);
    super({ ...profilerOptions, enabled: initialEnabled });

    this.#sink = sink;
    this.#debug = isEnvVarEnabled(debugEnvVar);

    this.#performanceObserverSink = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
      debugEnvVar,
    });

    if (initialEnabled) {
      this.#transition('running');
    }
  }

  /**
   * Returns whether debug mode is enabled for profiler state transitions.
   *
   * Debug mode is determined by the environment variable specified by `debugEnvVar`
   * (defaults to 'CP_PROFILER_DEBUG'). When enabled, profiler state transitions create
   * performance marks for debugging.
   *
   * @returns true if debug mode is enabled, false otherwise
   */
  get debug(): boolean {
    return this.#debug;
  }

  /**
   * Creates a performance marker for a profiler state transition.
   * @param transition - The state transition that occurred
   */
  #transitionMarker(transition: string): void {
    const transitionMarkerPayload: MarkerPayload = {
      dataType: 'marker',
      color: 'primary',
      tooltipText: `Profiler state transition: ${transition}`,
      properties: [['Transition', transition], ...objectToEntries(this.stats)],
    };
    this.marker(transition, transitionMarkerPayload);
  }

  #transition(next: 'idle' | 'running' | 'closed'): void {
    if (this.#state === next) {
      return;
    }
    if (this.#state === 'closed') {
      throw new Error('Profiler already closed');
    }

    const transition = `${this.#state}->${next}`;

    switch (transition) {
      case 'idle->running':
        super.setEnabled(true);
        this.#sink.open?.();
        this.#performanceObserverSink.subscribe();
        break;

      case 'running->idle':
      case 'running->closed':
        super.setEnabled(false);
        this.#performanceObserverSink.unsubscribe();
        this.#sink.close?.();
        break;

      case 'idle->closed':
        // No-op, was not open
        break;

      default:
        throw new Error(`Invalid transition: ${this.#state} -> ${next}`);
    }

    this.#state = next;

    if (this.#debug) {
      this.#transitionMarker(transition);
    }
  }

  /**
   * Closes profiler and releases resources. Idempotent, safe for exit handlers.
   * **Exit Handler Usage**: Call only this method from process exit handlers.
   */
  close(): void {
    this.#transition('closed');
  }

  /** @returns Current profiler state */
  get state(): 'idle' | 'running' | 'closed' {
    return this.#state;
  }

  /** @returns Whether profiler is in 'running' state */
  override isEnabled(): boolean {
    return this.#state === 'running';
  }

  /** Enables profiling (start/stop)*/
  override setEnabled(enabled: boolean): void {
    if (enabled) {
      this.#transition('running');
    } else {
      this.#transition('idle');
    }
  }

  /** @returns Queue statistics and profiling state for monitoring */
  get stats() {
    return {
      ...this.#performanceObserverSink.getStats(),
      debug: this.#debug,
      state: this.#state,
      walOpen: !this.#sink.isClosed(),
    };
  }

  /** Flushes buffered performance data to sink. */
  flush(): void {
    if (this.#state === 'closed') {
      return; // No-op if closed
    }
    this.#performanceObserverSink.flush();
  }
}
