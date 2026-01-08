import type { PerformanceEntry } from 'node:perf_hooks';
import {
  type MockedFunction,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { MockPerformanceObserver } from '@code-pushup/test-utils';
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

  getWrittenItems(): string[] {
    return [...this.writtenItems];
  }
}

describe('PerformanceObserverSink', () => {
  let encode: MockedFunction<(entry: PerformanceEntry) => string[]>;
  let sink: MockSink;
  let options: PerformanceObserverOptions<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    sink = new MockSink();
    encode = vi.fn((entry: PerformanceEntry) => [
      `${entry.name}:${entry.entryType}`,
    ]);
    options = {
      sink,
      encode,
      flushThreshold: 1,
    };
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

  it('should be isomorph and create a single observer on subscribe', () => {
    const observer = new PerformanceObserverSink(options);

    expect(observer.isSubscribed()).toBe(false);
    expect(MockPerformanceObserver.instances).toHaveLength(0);
    observer.subscribe();
    expect(observer.isSubscribed()).toBe(true);
    expect(MockPerformanceObserver.instances).toHaveLength(1);
    observer.subscribe();
    expect(observer.isSubscribed()).toBe(true);
    expect(MockPerformanceObserver.instances).toHaveLength(1);
  });

  it('skips non-mark and non-measure entry types', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();

    MockPerformanceObserver.lastInstance()?.emitNavigation('test-navigation');

    expect(encode).not.toHaveBeenCalled();
  });

  it('flushes existing performance entries', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe(); // Create the PerformanceObserver first

    MockPerformanceObserver.lastInstance()?.emitMark('test-mark');

    observer.flush();

    expect(encode).toHaveBeenCalledWith({
      name: 'test-mark',
      entryType: 'mark',
      startTime: 0,
      duration: 0,
    });
    expect(sink.getWrittenItems()).toStrictEqual(['test-mark:mark']);
  });

  it('handles flush gracefully when not connected', () => {
    const observer = new PerformanceObserverSink(options);

    observer.flush();

    expect(encode).not.toHaveBeenCalled();
    expect(sink.getWrittenItems()).toStrictEqual([]);
  });

  it('disconnects PerformanceObserver', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    observer.unsubscribe();

    expect(observer.isSubscribed()).toBe(false);
  });

  it('handles disconnect gracefully when not connected', () => {
    const observer = new PerformanceObserverSink(options);

    observer.unsubscribe();

    expect(observer.isSubscribed()).toBe(false);
  });

  it('reports connected state correctly', () => {
    const observer = new PerformanceObserverSink(options);

    expect(observer.isSubscribed()).toBe(false);

    observer.subscribe();

    expect(observer.isSubscribed()).toBe(true);
  });

  it('reports disconnected state correctly', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    observer.unsubscribe();

    expect(observer.isSubscribed()).toBe(false);
  });
});
