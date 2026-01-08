import { type PerformanceEntry, performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from './performance-observer.js';
import type { Sink } from './sink-source.types';

// @TODO remove duplicate when file-sink is implemented
class MockSink implements Sink<string, string> {
  private writtenItems: string[] = [];
  private closed = false;

  open(): void {
    this.closed = false;
  }

  write(input: string): void {
    this.writtenItems.push(input);
  }

  close(): void {
    this.closed = true;
  }

  isClosed(): boolean {
    return this.closed;
  }

  encode(input: string): string {
    return `${input}-${this.constructor.name}-encoded`;
  }

  recover(): string[] {
    return [...this.writtenItems];
  }
}

describe('PerformanceObserverSink', () => {
  let sink: MockSink;
  let options: PerformanceObserverOptions<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    performance.clearMeasures();
    performance.clearMarks();
    sink = new MockSink();

    options = {
      sink,
      encode: vi.fn((entry: PerformanceEntry) => [
        `${entry.name}:${entry.entryType}`,
      ]),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates instance with default options', () => {
    expect(() => new PerformanceObserverSink(options)).not.toThrow();
  });

  it('creates instance with custom options', () => {
    expect(
      () =>
        new PerformanceObserverSink({
          ...options,
          buffered: true,
          flushThreshold: 10,
        }),
    ).not.toThrow();
  });

  it('should observe performance entries and write them to the sink on flush', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    performance.mark('test-mark');
    observer.flush();
    expect(sink.recover()).toHaveLength(1);
  });

  it('should observe buffered performance entries when buffered is enabled', async () => {
    const observer = new PerformanceObserverSink({
      ...options,
      buffered: true,
    });

    performance.mark('test-mark-1');
    performance.mark('test-mark-2');
    await new Promise(resolve => setTimeout(resolve, 10));
    observer.subscribe();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(performance.getEntries()).toHaveLength(2);
    observer.flush();
    expect(sink.recover()).toHaveLength(2);
  });

  it('handles multiple encoded items per performance entry', () => {
    const multiEncodeFn = vi.fn(e => [
      `${e.entryType}-item1`,
      `${e.entryType}item2`,
    ]);
    const observer = new PerformanceObserverSink({
      ...options,
      encode: multiEncodeFn,
    });

    observer.subscribe();

    performance.mark('test-mark');
    observer.flush();

    expect(sink.recover()).toHaveLength(2);
  });
});
