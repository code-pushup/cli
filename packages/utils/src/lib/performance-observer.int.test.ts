import { type PerformanceEntry, performance } from 'node:perf_hooks';
import {
  type MockedFunction,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { MockSink } from '../../mocks/sink.mock';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from './performance-observer.js';

describe('PerformanceObserverSink', () => {
  let encode: MockedFunction<(entry: PerformanceEntry) => string[]>;
  let sink: MockSink;
  let options: PerformanceObserverOptions<string>;

  const awaitObserverCallback = () =>
    new Promise(resolve => setTimeout(resolve, 10));

  beforeEach(() => {
    sink = new MockSink();
    encode = vi.fn((entry: PerformanceEntry) => [
      `${entry.name}:${entry.entryType}`,
    ]);

    options = {
      sink,
      encode,
    };

    performance.clearMarks();
    performance.clearMeasures();
  });

  it('creates instance with required options', () => {
    expect(() => new PerformanceObserverSink(options)).not.toThrow();
  });

  it('internal PerformanceObserver should process observed entries', () => {
    const observer = new PerformanceObserverSink(options);
    observer.subscribe();

    performance.mark('test-mark');
    performance.measure('test-measure');
    observer.flush();
    expect(encode).toHaveBeenCalledTimes(2);
    expect(encode).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'test-mark',
        entryType: 'mark',
      }),
    );
    expect(encode).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: 'test-measure',
        entryType: 'measure',
      }),
    );
  });

  it('internal PerformanceObserver calls flush if flushThreshold exceeded', async () => {
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

  it('flush flushes observed entries when subscribed', () => {
    const observer = new PerformanceObserverSink(options);
    observer.subscribe();

    performance.mark('test-mark1');
    performance.mark('test-mark2');
    expect(sink.getWrittenItems()).toStrictEqual([]);

    observer.flush();
    expect(sink.getWrittenItems()).toStrictEqual([
      'test-mark1:mark',
      'test-mark2:mark',
    ]);
  });

  it('flush calls encode for each entry', () => {
    const observer = new PerformanceObserverSink(options);
    observer.subscribe();

    performance.mark('test-mark1');
    performance.mark('test-mark2');

    observer.flush();

    expect(encode).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-mark1',
        entryType: 'mark',
      }),
    );
    expect(encode).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-mark2',
        entryType: 'mark',
      }),
    );
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

  it('should observe performance entries and write them to the sink on flush', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    performance.mark('test-mark');
    observer.flush();
    expect(sink.getWrittenItems()).toHaveLength(1);
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
    expect(sink.getWrittenItems()).toHaveLength(2);
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

    expect(sink.getWrittenItems()).toHaveLength(2);
  });
});
