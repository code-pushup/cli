import {
  type PerformanceEntry,
  PerformanceObserver,
  performance,
} from 'node:perf_hooks';
import type { Buffered, Encoder, Sink } from './sink-source.types.js';

export interface PerformanceObserverOptions<T> {
  sink: Sink<T, unknown>;
  encode: (entry: PerformanceEntry) => T[];
  onEntry?: (entry: T) => void;
  captureBuffered?: boolean;
  flushEveryN?: number;
}

export class PerformanceObserverHandle<T>
  implements Buffered, Encoder<PerformanceEntry, T[]>
{
  #encode: (entry: PerformanceEntry) => T[];
  #captureBuffered: boolean;
  #flushEveryN: number;
  #flushThreshold: number;
  #onEntry?: (entry: T) => void;
  #processedEntries = new Set<string>();
  #sink: Sink<T, unknown>;
  #observer: PerformanceObserver | undefined;
  #closed = false;

  constructor(options: PerformanceObserverOptions<T>) {
    this.#encode = options.encode;
    this.#sink = options.sink;
    this.#captureBuffered = options.captureBuffered ?? false;
    this.#flushThreshold = options.flushEveryN ?? 20;
    this.#flushEveryN = 0;
    this.#onEntry = options.onEntry;
  }

  encode(entry: PerformanceEntry): T[] {
    return this.#encode(entry);
  }

  connect(): void {
    if (this.#observer || this.#closed) return;
    this.#observer = new PerformanceObserver(() => {
      this.#flushEveryN++;
      if (this.#flushEveryN >= this.#flushThreshold) {
        this.flush();
        this.#flushEveryN = 0;
      }
    });

    this.#observer.observe({
      entryTypes: ['mark', 'measure'],
      buffered: this.#captureBuffered,
    });
  }

  flush(clear = false): void {
    if (this.#closed || !this.#sink) return;
    const entries = [
      ...performance.getEntriesByType('mark'),
      ...performance.getEntriesByType('measure'),
    ];

    // Process all entries
    for (const e of entries) {
      if (e.entryType !== 'mark' && e.entryType !== 'measure') continue;

      // Skip if already processed (unless clearing)
      if (!clear && this.#processedEntries.has(e.name)) continue;

      const encoded = this.encode(e);
      for (const item of encoded) {
        this.#sink.write(item);
        this.#onEntry?.(item);
      }

      if (clear) {
        this.#processedEntries.delete(e.name);
        if (e.entryType === 'mark') performance.clearMarks(e.name);
        if (e.entryType === 'measure') performance.clearMeasures(e.name);
      } else {
        this.#processedEntries.add(e.name);
      }
    }
  }

  disconnect(): void {
    if (!this.#observer) return;
    this.#observer?.disconnect();
    this.#observer = undefined;
  }

  close(): void {
    if (this.#closed) return;
    this.flush();
    this.#closed = true;
    this.disconnect();
  }

  isConnected(): boolean {
    return this.#observer !== undefined && !this.#closed;
  }
}
