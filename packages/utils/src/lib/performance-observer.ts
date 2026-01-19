import { type PerformanceEntry, PerformanceObserver } from 'node:perf_hooks';
import type { Buffered, Observer, Sink } from './sink-source.type';

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
   * Must implement the Sink interface for handling the encoded data.
   */
  sink: Sink<T, unknown>;

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
   * Threshold for triggering queue flushes based on queue length.
   * Flushes occur when queue length reaches (maxQueueSize - flushThreshold).
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
};

/**
 * A sink implementation that observes Node.js performance entries and forwards them to a configurable sink.
 *
 * This class provides a buffered, memory-safe bridge between Node.js PerformanceObserver
 * and application-specific data sinks. It handles performance entry encoding, queue management,
 * and graceful degradation under high load conditions.
 *
 * @template T - The type of encoded performance data written to the sink
 * @implements {Observer} - Lifecycle management interface
 * @implements {Buffered} - Queue statistics interface
 */
export class PerformanceObserverSink<T> implements Observer, Buffered {
  /** Encoder function for transforming PerformanceEntry objects into domain types */
  #encodePerfEntry: PerformanceEntryEncoder<T>;

  /** Whether buffered observation mode is enabled */
  #buffered: boolean;

  /** Threshold for triggering flushes based on queue length proximity to max capacity */
  #flushThreshold: number;

  /** Maximum number of items allowed in queue before dropping new entries (hard memory limit) */
  #maxQueueSize: number;

  /** The target sink where encoded performance data is written */
  #sink: Sink<T, unknown>;

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
    } = options;
    this.#encodePerfEntry = encodePerfEntry;
    this.#sink = sink;
    this.#buffered = captureBufferedEntries ?? true;
    this.#maxQueueSize = maxQueueSize;
    validateFlushThreshold(flushThreshold, this.#maxQueueSize);
    this.#flushThreshold = flushThreshold;
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
   *
   * @throws {Error} If the sink is closed before subscription
   *
   */
  subscribe(): void {
    if (this.#observer) {
      return;
    }

    this.#observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (OBSERVED_TYPE_SET.has(entry.entryType as ObservedEntryType)) {
          const items = this.encode(entry);
          items.forEach(item => {
            if (this.#queue.length >= this.#maxQueueSize) {
              this.#dropped++;
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
        }
      });

      if (this.#addedSinceLastFlush >= this.#flushThreshold) {
        this.flush();
      }
    });

    this.#observer.observe({
      entryTypes: OBSERVED_TYPES,
      buffered: this.#buffered,
    });

    if (this.#buffered) {
      this.flush();
    }
  }

  /**
   * Flushes all queued performance entries to the sink.
   *
   * Writes all currently queued encoded performance entries to the configured sink.
   * If the sink is closed during flush, the queue is cleared without writing.
   * The queue is always cleared after flush attempt, regardless of success or failure.
   *
   * @throws {Error} If sink write operations fail (with original error as cause)
   */
  flush(): void {
    if (this.#queue.length === 0) {
      return;
    }

    try {
      this.#queue.forEach(item => {
        this.#sink.write(item);
        this.#written++;
      });
    } catch (error) {
      this.#dropped += this.#queue.length;
      throw new Error(
        'PerformanceObserverSink failed to write items to sink.',
        { cause: error },
      );
    } finally {
      this.#queue.length = 0;
      this.#addedSinceLastFlush = 0;
    }
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
    this.#queue.length = 0;
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
