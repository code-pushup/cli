import {
  type PerformanceEntry,
  PerformanceObserver,
  performance,
} from 'node:perf_hooks';
import type { AppendableSink } from './wal.js';

/**
 * Encoder that converts PerformanceEntry to domain events.
 *
 * Pure function that transforms performance entries into domain events.
 * Should be stateless, synchronous, and have no side effects.
 * Returns a readonly array of encoded items.
 */
export type PerformanceEntryEncoder<F> = (
  entry: PerformanceEntry,
) => readonly F[];

/**
 * Array of performance entry types that this observer monitors.
 * Only 'mark' and 'measure' entries are tracked as they represent
 * user-defined performance markers and measurements.
 */
const OBSERVED_TYPES = ['mark', 'measure'] as const;
type ObservedEntryType = 'mark' | 'measure';
const OBSERVED_TYPE_SET = new Set<ObservedEntryType>(OBSERVED_TYPES);

/**
 * Converts an error to a performance mark name for debugging.
 * @param error - The error that occurred
 * @param entry - The performance entry that failed to encode
 * @returns A mark name string
 */
function errorToPerfMark(error: unknown, entry: PerformanceEntry): string {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const entryName = entry.name || 'unnamed';
  return `encode-error:${errorName}:${entryName}`;
}

/**
 * Default threshold for triggering queue flushes based on queue length.
 * When the queue length reaches (maxQueueSize - flushThreshold),
 * a flush is triggered to prevent overflow. This provides a buffer zone
 * before hitting the maximum queue capacity.
 */
export const DEFAULT_FLUSH_THRESHOLD = 20;

/**
 * Default maximum number of items allowed in the queue before entries are dropped.
 * This acts as a memory safety limit to prevent unbounded memory growth
 * in case of sink slowdown or high-frequency performance entries.
 */
export const DEFAULT_MAX_QUEUE_SIZE = 10_000;

/**
 * Validates the flush threshold configuration to ensure sensible bounds.
 *
 * The flush threshold must be positive and cannot exceed the maximum queue size,
 * as it represents a buffer zone within the queue capacity.
 *
 * @param flushThreshold - The threshold value to validate (must be > 0)
 * @param maxQueueSize - The maximum queue size for comparison (flushThreshold <= maxQueueSize)
 * @throws {Error} If flushThreshold is not positive or exceeds maxQueueSize
 */
export function validateFlushThreshold(
  flushThreshold: number,
  maxQueueSize: number,
): void {
  if (flushThreshold <= 0) {
    throw new Error('flushThreshold must be > 0');
  }
  if (flushThreshold > maxQueueSize) {
    throw new Error('flushThreshold must be <= maxQueueSize');
  }
}

/**
 * Configuration options for the PerformanceObserverSink.
 *
 * @template T - The type of encoded performance data that will be written to the sink
 */
export type PerformanceObserverOptions<T> = {
  /**
   * The sink where encoded performance entries will be written.
   * Must implement the AppendableSink interface for handling the encoded data.
   */
  sink: AppendableSink<T>;

  /**
   * Function that encodes raw PerformanceEntry objects into domain-specific types.
   * This transformer converts Node.js performance entries into application-specific data structures.
   * Returns a readonly array of encoded items.
   */
  encodePerfEntry: PerformanceEntryEncoder<T>;

  /**
   * Whether to enable buffered observation mode.
   * When true, captures all performance entries that occurred before observation started.
   * When false, only captures entries after subscription begins.
   *
   * @default true
   */
  captureBufferedEntries?: boolean;

  /**
   * Threshold for triggering queue flushes.
   * Flushes occur in two scenarios:
   * 1. When queue length reaches (maxQueueSize - flushThreshold)
   * 2. When the number of items added since last flush reaches flushThreshold
   * Larger values provide more buffer space before hitting capacity limits.
   *
   * @default DEFAULT_FLUSH_THRESHOLD (20)
   */
  flushThreshold?: number;

  /**
   * Maximum number of items allowed in the queue before new entries are dropped.
   * Acts as a memory safety limit to prevent unbounded growth during sink slowdown.
   *
   * @default DEFAULT_MAX_QUEUE_SIZE (10000)
   */
  maxQueueSize?: number;
  /**
   * Whether debug mode is enabled for encode failures.
   * When true, encode failures create performance marks for debugging.
   *
   */
  debug: boolean
};

/**
 * A sink implementation that observes Node.js performance entries and forwards them to a configurable sink.
 *
 * This class provides a buffered, memory-safe bridge between Node.js PerformanceObserver
 * and application-specific data sinks. It handles performance entry encoding, queue management,
 * and graceful degradation under high load conditions.
 *
 * Performance entries flow through the following lifecycle:
 *
 * - Queued in Memory 💾
 *   - Items stored in queue (`#queue`) until flushed
 *   - Queue limited by `maxQueueSize` to prevent unbounded growth
 *   - Items remain in queue if sink is closed during flush
 *
 * - Successfully Written 📤
 *   - Items written to sink and counted in `getStats().written`
 *   - Queue cleared after successful batch writes
 *
 * - Item Disposition Scenarios 💥
 *   - **Encode Failure**: ❌ Items lost when `encode()` throws. Creates perf mark if 'DEBUG' env var is set to 'true'.
 *   - **Sink Write Failure**: 💾 Items stay in queue when sink write fails during flush
 *   - **Sink Closed**: 💾 Items stay in queue when sink is closed during flush
 *   - **Proactive Flush Throws**: 💾 Items stay in queue when `flush()` throws during threshold check
 *   - **Final Flush Throws**: 💾 Items stay in queue when `flush()` throws at end of callback
 *   - **Buffered Flush Throws**: 💾 Items stay in queue when buffered entries flush fails
 *   - **Queue Overflow**: ❌ Items dropped when queue reaches `maxQueueSize`
 *
 * @template T - The type of encoded performance data written to the sink
 * @implements {Observer} - Lifecycle management interface
 * @implements {Buffered} - Queue statistics interface
 */
export class PerformanceObserverSink<T> {
  /** Encoder function for transforming PerformanceEntry objects into domain types */
  #encodePerfEntry: PerformanceEntryEncoder<T>;

  /** Whether buffered observation mode is enabled */
  #buffered: boolean;

  /** Threshold for triggering flushes based on queue length proximity to max capacity */
  #flushThreshold: number;

  /** Maximum number of items allowed in queue before dropping new entries (hard memory limit) */
  #maxQueueSize: number;

  /** The target sink where encoded performance data is written */
  #sink: AppendableSink<T>;

  /** Node.js PerformanceObserver instance, undefined when not subscribed */
  #observer: PerformanceObserver | undefined;

  /** Bounded queue storing encoded performance items awaiting flush */
  #queue: T[] = [];

  /** Count of performance entries dropped due to queue overflow */
  #dropped = 0;

  /** Count of performance entries successfully written to sink */
  #written = 0;

  /** Number of items added to queue since last successful flush */
  #addedSinceLastFlush = 0;

  /** Whether debug mode is enabled for encode failures */
  #debug: boolean;

  private processPerformanceEntries(entries: PerformanceEntry[]) {
    entries.forEach(entry => {
      if (OBSERVED_TYPE_SET.has(entry.entryType as ObservedEntryType)) {
        try {
          const items = this.encode(entry);
          items.forEach(item => {
            // ❌ MAX QUEUE OVERFLOW
            if (this.#queue.length >= this.#maxQueueSize) {
              this.#dropped++; // Items are lost forever
              return;
            }

            if (
              this.#queue.length >=
              this.#maxQueueSize - this.#flushThreshold
            ) {
              this.flush();
            }
            this.#queue.push(item);
            this.#addedSinceLastFlush++;
          });
        } catch (error) {
          // ❌ Encode failure: item lost forever as user has to fix encode function.
          this.#dropped++;
          if (this.#debug) {
            try {
              performance.mark(errorToPerfMark(error, entry));
            } catch {
              // Ignore mark failures to prevent double errors
            }
          }
        }
      }
    });

    if (this.#addedSinceLastFlush >= this.#flushThreshold) {
      this.flush();
    }
  }

  /**
   * Creates a new PerformanceObserverSink with the specified configuration.
   *
   * @param options - Configuration options for the performance observer sink
   * @throws {Error} If flushThreshold validation fails (must be > 0 and <= maxQueueSize)
   */
  constructor(options: PerformanceObserverOptions<T>) {
    const {
      encodePerfEntry,
      sink,
      captureBufferedEntries,
      flushThreshold = DEFAULT_FLUSH_THRESHOLD,
      maxQueueSize = DEFAULT_MAX_QUEUE_SIZE,
      debug,
    } = options;
    this.#encodePerfEntry = encodePerfEntry;
    this.#sink = sink;
    this.#buffered = captureBufferedEntries ?? true;
    this.#maxQueueSize = maxQueueSize;
    validateFlushThreshold(flushThreshold, this.#maxQueueSize);
    this.#flushThreshold = flushThreshold;
    this.#debug = debug;
  }

  /**
   * Returns whether debug mode is enabled for encode failures.
   *
   * Debug mode is determined by the environment variable 'DEBUG'
   * performance marks for debugging.
   *
   * @returns true if debug mode is enabled, false otherwise
   */
  get debug(): boolean {
    return this.#debug;
  }

  /**
   * Returns current queue statistics for monitoring and debugging.
   *
   * Provides insight into the current state of the performance entry queue,
   * useful for monitoring memory usage and processing throughput.
   *
   * @returns Object containing all states and entry counts
   */
  getStats() {
    return {
      isSubscribed: this.isSubscribed(),
      queued: this.#queue.length,
      dropped: this.#dropped,
      written: this.#written,
      maxQueueSize: this.#maxQueueSize,
      flushThreshold: this.#flushThreshold,
      addedSinceLastFlush: this.#addedSinceLastFlush,
      buffered: this.#buffered,
    };
  }

  /**
   * Encodes a raw PerformanceEntry using the configured encoder function.
   *
   * This method delegates to the user-provided encoder function, allowing
   * transformation of Node.js performance entries into application-specific types.
   *
   * @param entry - The raw performance entry to encode
   * @returns Readonly array of encoded items
   */
  encode(entry: PerformanceEntry): readonly T[] {
    return this.#encodePerfEntry(entry);
  }

  /**
   * Starts observing performance entries and forwarding them to the sink.
   *
   * Creates a Node.js PerformanceObserver that monitors 'mark' and 'measure' entries.
   * The observer uses a bounded queue with proactive flushing to manage memory usage.
   * When buffered mode is enabled, any existing buffered entries are immediately flushed.
   * If the sink is closed, items stay in the queue until reopened.
   *
   */
  subscribe(): void {
    if (this.#observer) {
      return;
    }

    this.#observer = new PerformanceObserver(list => {
      this.processPerformanceEntries(list.getEntries());
    });

    // When buffered mode is enabled, Node.js PerformanceObserver invokes
    // the callback synchronously with all buffered entries before observe() returns.
    // However, entries created before any observer existed may not be buffered by Node.js.
    // We manually retrieve entries from the performance buffer using getEntriesByType()
    // to capture entries that were created before the observer was created.
    if (this.#buffered) {
      const existingMarks = performance.getEntriesByType('mark');
      const existingMeasures = performance.getEntriesByType('measure');
      const allEntries = [...existingMarks, ...existingMeasures];
      this.processPerformanceEntries(allEntries);
    }

    this.#observer.observe({
      entryTypes: OBSERVED_TYPES,
      // @NOTE: This is for unknown reasons not working, and we manually do it above
      // buffered: this.#buffered,
    });
  }

  /**
   * Flushes all queued performance entries to the sink.
   *
   * Writes all currently queued encoded performance entries to the configured sink.
   * If the sink is closed, flush is a no-op and items stay in the queue until reopened.
   * The queue is always cleared after flush attempt, regardless of success or failure.
   */
  flush(): void {
    if (this.#queue.length === 0) {
      return;
    }
    if (this.#sink.isClosed()) {
      return;
    }

    // Process each item in queue
    const failedItems: T[] = [];

    this.#queue.forEach(item => {
      try {
        this.#sink.append(item);
        this.#written++;
      } catch {
        failedItems.push(item);
      }
    });

    // Clear queue but keep failed items for retry
    this.#queue.length = 0;
    this.#queue.push(...failedItems);
    this.#addedSinceLastFlush = failedItems.length;
  }

  /**
   * Stops observing performance entries and cleans up resources.
   *
   * Performs a final flush of any remaining queued entries, then disconnects
   * the PerformanceObserver and releases all references.
   *
   * This method is idempotent - safe to call multiple times.
   */
  unsubscribe(): void {
    if (!this.#observer) {
      return;
    }
    this.flush();
    this.#addedSinceLastFlush = 0;
    this.#observer.disconnect();
    this.#observer = undefined;
  }

  /**
   * Checks whether the performance observer is currently active.
   *
   * Returns true if the sink is subscribed and actively observing performance entries.
   * This indicates that a PerformanceObserver instance exists and is connected.
   *
   * @returns true if currently subscribed and observing, false otherwise
   */
  isSubscribed(): boolean {
    return this.#observer !== undefined;
  }
}
