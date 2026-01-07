import {
  type PerformanceEntry,
  PerformanceObserver,
  performance,
} from 'node:perf_hooks';
import type { Buffered, Encoder, Sink } from './sink-source.types.js';

export const DEFAULT_FLUSH_THRESHOLD = 20;

export type PerformanceObserverOptions<T> = {
  sink: Sink<T, unknown>;
  encode: (entry: PerformanceEntry) => T[];
  captureBuffered?: boolean;
  flushThreshold?: number;
};

export class PerformanceObserverHandle<T>
  implements Buffered, Encoder<PerformanceEntry, T[]>
{
  #encode: (entry: PerformanceEntry) => T[];
  #captureBuffered: boolean;
  #observedEntryCount: number;
  #flushThreshold: number;
  #sink: Sink<T, unknown>;
  #observer: PerformanceObserver | undefined;
  #closed = false;

  constructor(options: PerformanceObserverOptions<T>) {
    this.#encode = options.encode;
    this.#sink = options.sink;
    this.#captureBuffered = options.captureBuffered ?? false;
    this.#flushThreshold = options.flushThreshold ?? DEFAULT_FLUSH_THRESHOLD;
    this.#observedEntryCount = 0;
  }

  encode(entry: PerformanceEntry): T[] {
    return this.#encode(entry);
  }

  connect(): void {
    if (this.#observer || this.#closed) {
      return;
    }
    this.#observer = new PerformanceObserver(() => {
      this.#observedEntryCount++;
      if (this.#observedEntryCount >= this.#flushThreshold) {
        this.flush();
        this.#observedEntryCount = 0;
      }
    });

    this.#observer.observe({
      entryTypes: ['mark', 'measure'],
      buffered: this.#captureBuffered,
    });
  }

  flush(clear = false): void {
    if (this.#closed || !this.#sink) {
      return;
    }
    const entries = [
      ...performance.getEntriesByType('mark'),
      ...performance.getEntriesByType('measure'),
    ];

    // Process all entries
    entries
      .filter(e => e.entryType === 'mark' || e.entryType === 'measure')
      .forEach(e => {
        const encoded = this.encode(e);
        encoded.forEach(item => {
          this.#sink.write(item);
        });

        if (clear) {
          if (e.entryType === 'mark') {
            performance.clearMarks(e.name);
          }
          if (e.entryType === 'measure') {
            performance.clearMeasures(e.name);
          }
        }
      });
  }

  disconnect(): void {
    if (!this.#observer) {
      return;
    }
    this.#observer?.disconnect();
    this.#observer = undefined;
  }

  close(): void {
    if (this.#closed) {
      return;
    }
    this.flush();
    this.#closed = true;
    this.disconnect();
  }

  isConnected(): boolean {
    return this.#observer !== undefined && !this.#closed;
  }
}
