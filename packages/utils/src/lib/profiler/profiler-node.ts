import { performance } from 'node:perf_hooks';
import { isEnvVarEnabled } from '../env.js';
import { type FatalKind, subscribeProcessExit } from '../exit-process.js';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from '../performance-observer.js';
import { objectToEntries } from '../transform.js';
import {
  asOptions,
  markerPayload,
 errorToMarkerPayload } from '../user-timing-extensibility-api-utils.js';
import type {
  ActionTrackEntryPayload,
  MarkerPayload,
} from '../user-timing-extensibility-api.type.js';
import { ShardedWal } from '../wal-sharded.js';
import {
  type WalFormat,
  type WalRecord,
  WriteAheadLogFile,
  parseWalFormat,
} from '../wal.js';
import {
  PROFILER_DEBUG_MEASURE_PREFIX,
  PROFILER_ENABLED_ENV_VAR,
  PROFILER_MEASURE_NAME_ENV_VAR,
  PROFILER_OUT_DIR_ENV_VAR,
  PROFILER_PERSIST_OUT_DIR,
  PROFILER_SHARDER_ID_ENV_VAR,
} from './constants.js';
import { Profiler, type ProfilerOptions } from './profiler.js';

export type ProfilerBufferOptions<DomainEvents extends WalRecord> = Omit<
  PerformanceObserverOptions<DomainEvents>,
  'sink' | 'encodePerfEntry'
>;
export type ProfilerFormat<DomainEvents extends WalRecord> = Partial<
  WalFormat<DomainEvents>
> &
  Pick<PerformanceObserverOptions<DomainEvents>, 'encodePerfEntry'>;
export type PersistOptions<DomainEvents extends WalRecord> = {
  /**
   * Output directory for WAL shards and final files.
   * @default 'tmp/profiles'
   */
  outDir?: string;

  /**
   * Optional name for your measurement that is reflected in path name. If not provided, a new group ID will be generated.
   */
  measureName?: string;
  /**
   * WAL format configuration for sharded write-ahead logging.
   * Defines codec, extensions, and finalizer for the WAL files.
   */
  format: ProfilerFormat<DomainEvents>;
};

/**
 * Options for configuring a NodejsProfiler instance.
 *
 * Extends ProfilerOptions with a required sink parameter.
 *
 * @template Tracks - Record type defining available track names and their configurations
 */
export type NodejsProfilerOptions<
  DomainEvents extends WalRecord,
  Tracks extends Record<string, Omit<ActionTrackEntryPayload, 'dataType'>>,
> = ProfilerOptions<Tracks> &
  ProfilerBufferOptions<DomainEvents> &
  PersistOptions<DomainEvents>;

export type NodeJsProfilerState = 'idle' | 'running' | 'closed';

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
  DomainEvents extends WalRecord,
  Tracks extends Record<string, ActionTrackEntryPayload> = Record<
    string,
    ActionTrackEntryPayload
  >,
> extends Profiler<Tracks> {
  #shard: WriteAheadLogFile<DomainEvents>;
  #sharder: ShardedWal<DomainEvents>;
  #performanceObserverSink: PerformanceObserverSink<DomainEvents>;
  #state: 'idle' | 'running' | 'closed' = 'idle';
  #unsubscribeExitHandlers: (() => void) | undefined;

  /**
   * Creates a NodejsProfiler instance.
   * A WriteAheadLogFile sink is automatically created for buffering performance data.
   * @param options - Configuration options
   */

  constructor(options: NodejsProfilerOptions<DomainEvents, Tracks>) {
    const {
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
      format: profilerFormat,
      measureName,
      outDir = PROFILER_PERSIST_OUT_DIR,
      enabled,
      debug,
      ...profilerOptions
    } = options;

    super({ ...profilerOptions, enabled, debug });

    this.#initializeStorage(profilerFormat, {
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
      measureName,
      outDir,
      debug,
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

    const initialEnabled =
      options.enabled ?? isEnvVarEnabled(PROFILER_ENABLED_ENV_VAR);
    if (initialEnabled) {
      this.transition('running');
    }
  }

  #initializeStorage(
    profilerFormat: ProfilerFormat<DomainEvents>,
    options: {
      captureBufferedEntries?: boolean;
      flushThreshold?: number;
      maxQueueSize?: number;
      measureName?: string;
      outDir: string;
      debug?: boolean;
    },
  ) {
    const { encodePerfEntry, ...format } = profilerFormat;
    const { captureBufferedEntries, flushThreshold, maxQueueSize, measureName, outDir, debug } = options;

    this.#sharder = new ShardedWal<DomainEvents>({
      debug,
      dir: process.env[PROFILER_OUT_DIR_ENV_VAR] ?? outDir,
      format: parseWalFormat<DomainEvents>(format),
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      measureNameEnvVar: PROFILER_MEASURE_NAME_ENV_VAR,
      groupId: measureName,
    });

    this.#shard = this.#sharder.shard();
    this.#performanceObserverSink = new PerformanceObserverSink({
      sink: this.#shard,
      encodePerfEntry,
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
      debug: this.isDebugMode(),
    });
  }

  /**
   * Creates a performance marker for a profiler state transition.
   */
  #transitionMarker(transition: string): void {
    const transitionMarkerPayload: MarkerPayload = {
      dataType: 'marker',
      color: 'primary',
      tooltipText: `Profiler state transition: ${transition}`,
      properties: [['Transition', transition], ...objectToEntries(this.stats)],
    };
    performance.mark(
      transition,
      asOptions(markerPayload(transitionMarkerPayload)),
    );
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
    this.#fatalErrorMarker(error, kind);
    this.close(); // Ensures buffers flush and sink finalizes
  }
  /**
   * Creates a fatal errors by marking them and shutting down the profiler.
   * @param error - The error that occurred
   * @param kind - The kind of fatal error (uncaughtException or unhandledRejection)
   */
  #fatalErrorMarker(error: unknown, kind: FatalKind): void {
    this.marker(
      'Fatal Error',
      errorToMarkerPayload(error, {
        tooltipText: `${kind} caused fatal error`,
      }),
    );
  }

  /**
   * Transitions the profiler to a new state, performing necessary setup/teardown operations.
   *
   * State transitions enforce lifecycle invariants:
   * - `idle -> running`: Enables profiling, opens sink, and subscribes to performance observer
   * - `running -> idle`: Disables profiling, unsubscribes, and closes sink (sink will be reopened on re-enable)
   * - `running -> closed`: Disables profiling, unsubscribes, closes sink, and finalizes shards (irreversible)
   * - `idle -> closed`: Closes sink if it was opened and finalizes shards (irreversible)
   *
   * @param next - The target state to transition to
   * @throws {Error} If attempting to transition from 'closed' state or invalid transition
   */
  protected transition(next: NodeJsProfilerState): void {
    if (this.#state === next) {
      return;
    }
    if (this.#state === 'closed') {
      throw new Error('Profiler already closed');
    }

    const transition = `${this.#state}->${next}`;
    if (this.isDebugMode()) {
      this.#transitionMarker(`${PROFILER_DEBUG_MEASURE_PREFIX}:${transition}`);
    }

    switch (transition) {
      case 'idle->running':
        super.setEnabled(true);
        this.#shard.open();
        this.#performanceObserverSink.subscribe();
        break;

      case 'running->idle':
        super.setEnabled(false);
        this.#performanceObserverSink.unsubscribe();
        this.#shard.close();
        break;

      case 'running->closed':
      case 'idle->closed':
        super.setEnabled(false);
        this.#performanceObserverSink.unsubscribe();
        this.#shard.close();
        this.#sharder.finalizeIfCoordinator();
        this.#unsubscribeExitHandlers?.();
        break;

      default:
        throw new Error(`Invalid transition: ${this.#state} -> ${next}`);
    }

    this.#state = next;
  }

  /**
   * Closes profiler and releases resources. Idempotent, safe for exit handlers.
   * **Exit Handler Usage**: Call only this method from process exit handlers.
   */
  close(): void {
    if (this.#state === 'closed') {
      return;
    }
    this.transition('closed');
  }

  /** @returns Whether profiler is in 'running' state */
  override isEnabled(): boolean {
    return this.#state === 'running';
  }

  /** Enables profiling (start/stop) */
  override setEnabled(enabled: boolean): void {
    if (enabled) {
      this.transition('running');
    } else {
      this.transition('idle');
    }
  }

  /** @returns Current profiler state */
  get state(): 'idle' | 'running' | 'closed' {
    return this.#state;
  }

  /** @returns Queue statistics and profiling state for monitoring */
  get stats() {
    const {
      state: sharderState,
      isCoordinator,
      ...sharderStats
    } = this.#sharder.stats;

    return {
      profilerState: this.#state,
      debug: this.isDebugMode(),
      sharderState,
      ...sharderStats,
      isCoordinator,
      shardOpen: !this.#shard.isClosed(),
      shardPath: this.#shard.getPath(),
      ...this.#performanceObserverSink.getStats(),
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
