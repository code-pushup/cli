import path from 'node:path';
import { isEnvVarEnabled } from '../env.js';
import { subscribeProcessExit } from '../exit-process.js';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from '../performance-observer.js';
import {
  type Counter,
  getUniqueInstanceId,
  getUniqueTimeId,
} from '../process-id.js';
import { objectToEntries } from '../transform.js';
import { errorToMarkerPayload } from '../user-timing-extensibility-api-utils.js';
import type {
  ActionTrackEntryPayload,
  MarkerPayload,
} from '../user-timing-extensibility-api.type.js';
import {
  type AppendableSink,
  WriteAheadLogFile,
  getShardedPath,
} from '../wal.js';
import {
  PROFILER_DEBUG_ENV_VAR,
  PROFILER_ENABLED_ENV_VAR,
} from './constants.js';
import { Profiler, type ProfilerOptions } from './profiler.js';
import { traceEventWalFormat } from './wal-json-trace.js';

/**
 * Options for configuring a NodejsProfiler instance.
 *
 * Extends ProfilerOptions with a required sink parameter.
 *
 * @template Tracks - Record type defining available track names and their configurations
 */
export type NodejsProfilerOptions<
  DomainEvents extends string | object,
  Tracks extends Record<string, ActionTrackEntryPayload>,
> = ProfilerOptions<Tracks> &
  Omit<PerformanceObserverOptions<DomainEvents>, 'sink'> & {
    /**
     * File path for the WriteAheadLogFile sink.
     * If not provided, defaults to `trace.json` in the current working directory.
     *
     * @default path.join(process.cwd(), 'trace.json')
     */
    filename?: string;
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
 * when the process exits. It automatically creates a {@link WriteAheadLogFile} sink that buffers
 * performance entries and ensures they are written out during process termination, even for unexpected exits.
 *
 * The sink uses a default codec for serializing performance data to JSON format,
 * enabling compatibility with Chrome DevTools trace file format.
 *
 * The profiler automatically subscribes to the performance observer when enabled and installs
 * exit handlers that flush buffered data on process termination (signals, fatal errors, or normal exit).
 *
 * @template DomainEvents - The type of domain-specific events encoded by the performance observer sink
 * @template Tracks - Record type defining available track names and their configurations
 */
export class NodejsProfiler<
  DomainEvents extends string | object,
  Tracks extends Record<string, ActionTrackEntryPayload> = Record<
    string,
    ActionTrackEntryPayload
  >,
> extends Profiler<Tracks> {
  #sink: AppendableSink<DomainEvents>;
  #performanceObserverSink: PerformanceObserverSink<DomainEvents>;
  #state: 'idle' | 'running' | 'closed' = 'idle';
  #debug: boolean;
  #unsubscribeExitHandlers: (() => void) | undefined;
  #shardCounter: Counter = {
    next: (() => {
      let count = 0;
      return () => ++count;
    })(),
  };

  /**
   * Creates a NodejsProfiler instance.
   * A WriteAheadLogFile sink is automatically created for buffering performance data.
   * @param options - Configuration options
   */
  // eslint-disable-next-line max-lines-per-function
  constructor(options: NodejsProfilerOptions<DomainEvents, Tracks>) {
    const {
      encodePerfEntry,
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
      enabled,
      filename,
      debugEnvVar = PROFILER_DEBUG_ENV_VAR,
      ...profilerOptions
    } = options;
    const initialEnabled = enabled ?? isEnvVarEnabled(PROFILER_ENABLED_ENV_VAR);
    super({ ...profilerOptions, enabled: initialEnabled });

    const walFormat = traceEventWalFormat();
    this.#sink = new WriteAheadLogFile({
      file:
        filename ??
        path.join(
          process.cwd(),
          getShardedPath({
            dir: 'tmp/profiles',
            groupId: getUniqueTimeId(),
            shardId: getUniqueInstanceId(this.#shardCounter),
            format: walFormat,
          }),
        ),
      codec: walFormat.codec,
    }) as AppendableSink<DomainEvents>;
    this.#debug = isEnvVarEnabled(debugEnvVar);

    this.#performanceObserverSink = new PerformanceObserverSink({
      sink: this.#sink,
      encodePerfEntry,
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
      debugEnvVar,
    });

    this.#unsubscribeExitHandlers = subscribeProcessExit({
      onError: (
        error: unknown,
        kind: 'uncaughtException' | 'unhandledRejection',
      ) => {
        this.#handleFatalError(error, kind);
      },
      onExit: (_code: number) => {
        this.close();
      },
    });

    if (initialEnabled) {
      this.#transition('running');
    }
  }

  /**
   * Returns whether debug mode is enabled for profiler state transitions.
   *
   * Debug mode is initially determined by the environment variable specified by `debugEnvVar`
   * (defaults to 'CP_PROFILER_DEBUG') during construction, but can be changed at runtime
   * using {@link setDebugMode}. When enabled, profiler state transitions create
   * performance marks for debugging.
   *
   * @returns true if debug mode is enabled, false otherwise
   */
  get debug(): boolean {
    return this.#debug;
  }

  /**
   * Sets debug mode for profiler state transitions.
   *
   * When debug mode is enabled, profiler state transitions create performance marks
   * for debugging. This allows runtime control of debug mode without needing to
   * restart the application or change environment variables.
   *
   * @param enabled - Whether to enable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.#debug = enabled;
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

  /**
   * Handles fatal errors by marking them and shutting down the profiler.
   * @param error - The error that occurred
   * @param kind - The kind of fatal error (uncaughtException or unhandledRejection)
   */
  #handleFatalError(
    error: unknown,
    kind: 'uncaughtException' | 'unhandledRejection',
  ): void {
    this.marker(
      'Fatal Error',
      errorToMarkerPayload(error, {
        tooltipText: `${kind} caused fatal error`,
      }),
    );
    this.close(); // Ensures buffers flush and sink finalizes
  }

  /**
   * Transitions the profiler to a new state, performing necessary setup/teardown operations.
   *
   * State transitions enforce lifecycle invariants:
   * - `idle -> running`: Enables profiling, opens sink, and subscribes to performance observer
   * - `running -> idle`: Disables profiling, unsubscribes, and closes sink (sink will be reopened on re-enable)
   * - `running -> closed`: Disables profiling, unsubscribes, and closes sink (irreversible)
   * - `idle -> closed`: Closes sink if it was opened (irreversible)
   *
   * @param next - The target state to transition to
   * @throws {Error} If attempting to transition from 'closed' state or invalid transition
   */
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
        // Sink may have been opened before, close it
        this.#sink.close?.();
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
    if (this.#state === 'closed') {
      return;
    }
    this.#unsubscribeExitHandlers?.();
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

  /** Enables profiling (start/stop) */
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

  /** @returns The file path of the WriteAheadLogFile sink */
  get filePath(): string {
    return (this.#sink as WriteAheadLogFile<DomainEvents>).getPath();
  }
}
