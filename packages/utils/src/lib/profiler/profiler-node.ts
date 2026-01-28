import path from 'node:path';
import { isEnvVarEnabled } from '../env.js';
import { type FatalKind, subscribeProcessExit } from '../exit-process.js';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from '../performance-observer.js';
import { getUniqueInstanceId } from '../process-id.js';
import { objectToEntries } from '../transform.js';
import { errorToMarkerPayload } from '../user-timing-extensibility-api-utils.js';
import type {
  ActionTrackEntryPayload,
  MarkerPayload,
} from '../user-timing-extensibility-api.type.js';
import { ShardedWal } from '../wal-sharded.js';
import { type WalFormat, WriteAheadLogFile } from '../wal.js';
import {
  PROFILER_ENABLED_ENV_VAR,
  SHARDED_WAL_COORDINATOR_ID_ENV_VAR,
} from './constants.js';
import { Profiler, type ProfilerOptions } from './profiler.js';
import { traceEventWalFormat } from './wal-json-trace.js';

export type ProfilerBufferOptions<DomainEvents extends object> = Omit<
  PerformanceObserverOptions<DomainEvents>,
  'sink' | 'encodePerfEntry'
>;
export type ProfilerFormat<DomainEvents extends object> = Partial<
  WalFormat<DomainEvents>
> &
  Pick<PerformanceObserverOptions<DomainEvents>, 'encodePerfEntry'>;
export type PersistOptions<DomainEvents extends object> = {
  /**
   * Output directory for WAL shards and final files.
   * @default 'tmp/profiles'
   */
  outDir?: string;

  /**
   * File path for the WriteAheadLogFile sink.
   * If not provided, defaults to `trace.json` in the current working directory.
   */
  filename?: string;
  /**
   * Override the base name for WAL files (overrides format.baseName).
   * If provided, this value will be merged into the format configuration.
   */
  baseName?: string;

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
  DomainEvents extends object,
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
  DomainEvents extends object,
  Tracks extends Record<string, ActionTrackEntryPayload> = Record<
    string,
    ActionTrackEntryPayload
  >,
> extends Profiler<Tracks> {
  #sharder: ShardedWal<DomainEvents>;
  #shard: WriteAheadLogFile<DomainEvents>;
  #performanceObserverSink: PerformanceObserverSink<DomainEvents>;
  #state: 'idle' | 'running' | 'closed' = 'idle';
  #unsubscribeExitHandlers: (() => void) | undefined;
  #outDir?: string;

  /**
   * Creates a NodejsProfiler instance.
   * A WriteAheadLogFile sink is automatically created for buffering performance data.
   * @param options - Configuration options
   */
  // eslint-disable-next-line max-lines-per-function
  constructor(options: NodejsProfilerOptions<DomainEvents, Tracks>) {
    // Pick ProfilerBufferOptions
    const {
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
      ...allButBufferOptions
    } = options;
    // Pick ProfilerPersistOptions
    const {
      format: profilerFormat,
      baseName,
      measureName,
      outDir,
      enabled,
      debug,
      ...profilerOptions
    } = allButBufferOptions;

    super(profilerOptions);

    const { encodePerfEntry, ...format } = profilerFormat;
    this.#outDir = outDir ?? 'tmp/profiles';

    // Merge baseName if provided
    const finalFormat = baseName ? { ...format, baseName } : format;

    this.#sharder = new ShardedWal<DomainEvents>({
      dir: this.#outDir,
      format: finalFormat,
      coordinatorIdEnvVar: SHARDED_WAL_COORDINATOR_ID_ENV_VAR,
      groupId: options.measureName,
    });
    this.#sharder.ensureCoordinator();
    this.#shard = this.#sharder.shard();
    this.#performanceObserverSink = new PerformanceObserverSink({
      sink: this.#shard,
      encodePerfEntry,
      captureBufferedEntries,
      flushThreshold,
      maxQueueSize,
    });

    this.#unsubscribeExitHandlers = subscribeProcessExit({
      onError: (error: unknown, kind: FatalKind) => {
        this.#fatalErrorMarker(error, kind);
        this.close();
      },
      onExit: (_code: number) => {
        this.close();
      },
    });

    const initialEnabled =
      options.enabled ?? isEnvVarEnabled(PROFILER_ENABLED_ENV_VAR);
    if (initialEnabled) {
      this.#transition('running');
    }
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
  #transition(next: NodeJsProfilerState): void {
    if (this.#state === next) {
      return;
    }
    if (this.#state === 'closed') {
      throw new Error('Profiler already closed');
    }

    const transition = `${this.#state}->${next}`;

    switch (transition) {
      case 'idle->running':
        // Set this profiler as coordinator if no coordinator is set yet
        ShardedWal.setCoordinatorProcess(
          SHARDED_WAL_COORDINATOR_ID_ENV_VAR,
          this.#sharder.id,
        );
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
        super.setEnabled(false);
        this.#performanceObserverSink.unsubscribe();
        this.#shard.close();
        this.#sharder.finalizeIfCoordinator();
        break;

      case 'idle->closed':
        // Shard may have been opened before, close it
        super.setEnabled(false);
        this.#performanceObserverSink.unsubscribe();
        this.#shard.close();
        this.#sharder.finalizeIfCoordinator();
        break;

      default:
        throw new Error(`Invalid transition: ${this.#state} -> ${next}`);
    }

    this.#state = next;

    if (this.isDebugMode()) {
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
    this.#transition('closed');
    this.#unsubscribeExitHandlers?.();
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

  /** @returns Current profiler state */
  get state(): 'idle' | 'running' | 'closed' {
    return this.#state;
  }

  /** @returns Whether debug mode is enabled */
  get debug(): boolean {
    return this.isDebugMode();
  }

  /** @returns Queue statistics and profiling state for monitoring */
  get stats() {
    const { state: sharderState, ...sharderStats } = this.#sharder.getStats();
    return {
      profilerState: this.#state,
      debug: this.isDebugMode(),
      sharderState,
      ...sharderStats,
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
