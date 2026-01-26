import {
  type PerformanceEntry,
  PerformanceObserver,
  type PerformanceObserverEntryList,
  performance,
} from 'node:perf_hooks';
import type { AppendableSink } from './wal.js';

const OBSERVED_TYPES = ['mark', 'measure'] as const;
type ObservedEntryType = 'mark' | 'measure';
export const DEFAULT_FLUSH_THRESHOLD = 20;

export type PerformanceObserverOptions<T> = {
  sink: AppendableSink<T>;
  encode: (entry: PerformanceEntry) => T[];
  buffered?: boolean;
  flushThreshold?: number;
};

export class PerformanceObserverSink<T> {
  #encode: (entry: PerformanceEntry) => T[];
  #buffered: boolean;
  #flushThreshold: number;
  #sink: AppendableSink<T>;
  #observer: PerformanceObserver | undefined;

  #pendingCount = 0;

  // "cursor" per type: how many we already wrote from the global buffer
  #written: Map<ObservedEntryType, number>;

  constructor(options: PerformanceObserverOptions<T>) {
    const { encode, sink, buffered, flushThreshold } = options;
    this.#encode = encode;
    this.#written = new Map<ObservedEntryType, number>(
      OBSERVED_TYPES.map(t => [t, 0]),
    );
    this.#sink = sink;
    this.#buffered = buffered ?? false;
    this.#flushThreshold = flushThreshold ?? DEFAULT_FLUSH_THRESHOLD;
  }

  encode(entry: PerformanceEntry): T[] {
    return this.#encode(entry);
  }

  subscribe(): void {
    if (this.#observer) {
      return;
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

    OBSERVED_TYPES.forEach(t => {
      const written = this.#written.get(t) ?? 0;
      const fresh = performance.getEntriesByType(t).slice(written);

      try {
        fresh
          .flatMap(entry => this.encode(entry))
          .forEach(item => this.#sink.append(item));

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
