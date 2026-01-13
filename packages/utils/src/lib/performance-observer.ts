import {
  type EntryType,
  type PerformanceEntry,
  PerformanceObserver,
  performance,
} from 'node:perf_hooks';
import type { Buffered, Encoder, Observer, Sink } from './sink-source.types.js';

export const DEFAULT_FLUSH_THRESHOLD = 20;

export type PerformanceObserverOptions<T> = {
  sink: Sink<T, unknown>;
  encode: (entry: PerformanceEntry) => T[];
  buffered?: boolean;
  flushThreshold?: number;
};

export class PerformanceObserverSink<T>
  implements Observer, Buffered, Encoder<PerformanceEntry, T[]>
{
  #encode: (entry: PerformanceEntry) => T[];
  #buffered: boolean;
  #flushThreshold: number;
  #sink: Sink<T, unknown>;
  #observer: PerformanceObserver | undefined;
  readonly #observedTypes: EntryType[] = ['mark', 'measure'];
  #getEntries = (listOrGlobal: {
    getEntriesByType: (t: EntryType) => PerformanceEntry[];
  }) => this.#observedTypes.flatMap(t => listOrGlobal.getEntriesByType(t));
  #observedCount: number = 0;

  constructor(options: PerformanceObserverOptions<T>) {
    this.#encode = options.encode;
    this.#sink = options.sink;
    this.#buffered = options.buffered ?? false;
    this.#flushThreshold = options.flushThreshold ?? DEFAULT_FLUSH_THRESHOLD;
  }

  encode(entry: PerformanceEntry): T[] {
    return this.#encode(entry);
  }

  subscribe(): void {
    if (this.#observer) {
      return;
    }

    this.#observer = new PerformanceObserver(list => {
      const entries = this.#getEntries(list);
      this.#observedCount += entries.length;
      if (this.#observedCount >= this.#flushThreshold) {
        this.flush(entries);
      }
    });

    this.#observer.observe({
      entryTypes: this.#observedTypes,
      buffered: this.#buffered,
    });
  }

  flush(entriesToProcess?: PerformanceEntry[]): void {
    if (!this.#observer) {
      return;
    }

    const entries = entriesToProcess || this.#getEntries(performance);
    entries.forEach(entry => {
      const encoded = this.encode(entry);
      encoded.forEach(item => {
        this.#sink.write(item);
      });
    });

    this.#observedCount = 0;
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
