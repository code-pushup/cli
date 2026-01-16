import {
  type PerformanceEntry,
  PerformanceObserver,
  type PerformanceObserverEntryList,
  performance,
} from 'node:perf_hooks';
import type { Buffered, Encoder, Observer, Sink } from './sink-source.type';

/**
 * Encoder that converts PerformanceEntry to domain events.
 *
 * Pure function that transforms performance entries into one or more domain events.
 * Should be stateless, synchronous, and have no side effects.
 */
export type PerformanceEntryEncoder<F> = (
  entry: PerformanceEntry,
) => readonly F[];

const OBSERVED_TYPES = ['mark', 'measure'] as const;
type ObservedEntryType = 'mark' | 'measure';
export const DEFAULT_FLUSH_THRESHOLD = 20;

export type PerformanceObserverOptions<T> = {
  sink: Sink<T, unknown>;
  encodePerfEntry: PerformanceEntryEncoder<T>;
  buffered?: boolean;
  flushThreshold?: number;
};

export class PerformanceObserverSink<T>
  implements Observer, Buffered, Encoder<PerformanceEntry, readonly T[]>
{
  #encodePerfEntry: PerformanceEntryEncoder<T>;
  #buffered: boolean;
  #flushThreshold: number;
  #sink: Sink<T, unknown>;
  #observer: PerformanceObserver | undefined;

  #pendingCount = 0;

  // "cursor" per type: how many we already wrote from the global buffer
  #written: Map<ObservedEntryType, number>;

  constructor(options: PerformanceObserverOptions<T>) {
    const { encodePerfEntry, sink, buffered, flushThreshold } = options;
    this.#encodePerfEntry = encodePerfEntry;
    this.#written = new Map<ObservedEntryType, number>(
      OBSERVED_TYPES.map(t => [t, 0]),
    );
    this.#sink = sink;
    this.#buffered = buffered ?? false;
    this.#flushThreshold = flushThreshold ?? DEFAULT_FLUSH_THRESHOLD;
  }

  encode(entry: PerformanceEntry): readonly T[] {
    return this.#encodePerfEntry(entry);
  }

  subscribe(): void {
    if (this.#observer) {
      return;
    }
    if (this.#sink.isClosed()) {
      throw new Error(
        `Sink ${this.#sink.constructor.name} must be opened before subscribing PerformanceObserver`,
      );
    }

    // Only used to trigger the flush - it's not processing the entries, just counting them
    this.#observer = new PerformanceObserver(
      (list: PerformanceObserverEntryList) => {
        const batchCount = OBSERVED_TYPES.reduce(
          (n, t) => n + list.getEntriesByType(t).length,
          0,
        );

        this.#pendingCount += batchCount;
        if (this.#pendingCount >= this.#flushThreshold) {
          this.flush();
        }
      },
    );

    this.#observer.observe({
      entryTypes: OBSERVED_TYPES,
      buffered: this.#buffered,
    });
  }

  flush(): void {
    if (!this.#observer) {
      return;
    }
    if (this.#sink.isClosed()) {
      throw new Error(
        `Sink ${this.#sink.constructor.name} must be opened before subscribing PerformanceObserver`,
      );
    }

    OBSERVED_TYPES.forEach(t => {
      const written = this.#written.get(t) ?? 0;
      const fresh = performance.getEntriesByType(t).slice(written);

      try {
        fresh
          .flatMap(entry => this.encode(entry))
          .forEach(item => this.#sink.write(item));

        this.#written.set(t, written + fresh.length);
      } catch (error) {
        throw new Error(
          'PerformanceObserverSink failed to write items to sink.',
          { cause: error },
        );
      }
    });

    this.#pendingCount = 0;
  }

  unsubscribe(): void {
    if (!this.#observer) {
      return;
    }
    this.#observer?.disconnect();
    this.#observer = undefined;
  }

  isSubscribed(): boolean {
    return this.#observer !== undefined;
  }
}
