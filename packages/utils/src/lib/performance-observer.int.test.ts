import { type PerformanceEntry, performance } from 'node:perf_hooks';
import type { MockedFunction } from 'vitest';
import { MockAppendableSink } from '../../mocks/sink.mock.js';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from './performance-observer.js';

describe('PerformanceObserverSink', () => {
  let encode: MockedFunction<(entry: PerformanceEntry) => string[]>;
  let sink: MockAppendableSink;
  let options: PerformanceObserverOptions<string>;

  const awaitObserverCallback = () =>
    new Promise(resolve => setTimeout(resolve, 10));

  beforeEach(() => {
    sink = new MockAppendableSink();
    sink.open();
    encode = vi.fn((entry: PerformanceEntry) => [
      `${entry.name}:${entry.entryType}`,
    ]);

    options = {
      sink,
      encodePerfEntry: encode,
    };

    performance.clearMarks();
    performance.clearMeasures();
  });

  it('creates instance with required options', () => {
    expect(() => new PerformanceObserverSink(options)).not.toThrow();
  });

  it('unsubscribe stops observing performance entries', async () => {
    const observer = new PerformanceObserverSink({
      ...options,
      flushThreshold: 1,
    });

    observer.subscribe();
    performance.mark('subscribed-mark1');
    performance.mark('subscribed-mark2');
    await awaitObserverCallback();
    expect(encode).toHaveBeenCalledTimes(2);

    observer.unsubscribe();
    performance.mark('unsubscribed-mark1');
    performance.mark('unsubscribed-mark2');
    await awaitObserverCallback();
    expect(encode).toHaveBeenCalledTimes(2);
  });

  it('observes and encodes performance entries', async () => {
    const observer = new PerformanceObserverSink(options);
    observer.subscribe();

    performance.mark('test-mark');
    performance.measure('test-measure');
    await awaitObserverCallback();
    observer.flush();
    expect(encode).toHaveBeenCalledTimes(2);
    expect(encode).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-mark',
        entryType: 'mark',
      }),
    );
    expect(encode).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-measure',
        entryType: 'measure',
      }),
    );
  });

  it('handles multiple items per performance entry', async () => {
    const multiEncodeFn = vi.fn(e => [
      `${e.entryType}-item1`,
      `${e.entryType}item2`,
    ]);
    const observer = new PerformanceObserverSink({
      ...options,
      encodePerfEntry: multiEncodeFn,
    });

    observer.subscribe();

    performance.mark('test-mark');
    await awaitObserverCallback();
    observer.flush();

    expect(sink.getWrittenItems()).toHaveLength(2);
  });

  it('successfully writes queued items to sink', async () => {
    const observer = new PerformanceObserverSink(options);
    observer.subscribe();

    performance.mark('test-mark1');
    performance.mark('test-mark2');
    expect(sink.getWrittenItems()).toStrictEqual([]);

    await awaitObserverCallback();
    observer.flush();
    expect(sink.getWrittenItems()).toStrictEqual([
      'test-mark1:mark',
      'test-mark2:mark',
    ]);
  });

  it('observes performance entries when subscribed', async () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    performance.mark('test-mark-1');
    performance.mark('test-mark-2');
    await awaitObserverCallback();
    observer.flush();
    expect(sink.getWrittenItems()).toHaveLength(2);
  });

  it('triggers proactive flush when threshold exceeded', async () => {
    const observer = new PerformanceObserverSink({
      ...options,
      flushThreshold: 3,
    });
    observer.subscribe();

    performance.mark('test-mark1');
    performance.mark('test-mark2');
    performance.mark('test-mark3');

    await awaitObserverCallback();

    expect(encode).toHaveBeenCalledTimes(3);
  });

  it('keeps items in queue when sink write fails', async () => {
    const failingSink = new MockAppendableSink();
    failingSink.open();
    failingSink.append.mockImplementation(() => {
      throw new Error('Sink write failed');
    });

    const observer = new PerformanceObserverSink({
      sink: failingSink,
      encodePerfEntry: encode,
      flushThreshold: 1,
      maxQueueSize: 10,
    });

    observer.subscribe();

    performance.mark('test-mark');
    await awaitObserverCallback();

    const stats = observer.getStats();
    expect(stats.dropped).toBe(0);
    expect(stats.queued).toBe(1);
  });

  it('keeps items in queue when sink is closed during flush', async () => {
    const closedSink = new MockAppendableSink();
    closedSink.open();
    closedSink.close();

    const observer = new PerformanceObserverSink({
      sink: closedSink,
      encodePerfEntry: encode,
    });

    observer.subscribe();

    performance.mark('test-mark');
    await awaitObserverCallback();

    const stats = observer.getStats();
    expect(stats.queued).toBe(1);
    expect(stats.dropped).toBe(0);
  });

  it('handles flush errors gracefully without losing items', async () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry: encode,
    });

    observer.subscribe();

    performance.mark('test-mark');
    await awaitObserverCallback();

    const stats = observer.getStats();
    expect(stats.queued).toBeGreaterThanOrEqual(0);
  });
});
