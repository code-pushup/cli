import { type PerformanceEntry, performance } from 'node:perf_hooks';
import {
  type MockedFunction,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { MockPerformanceObserver } from '@code-pushup/test-utils';
import { MockSink } from '../../mocks/sink.mock';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from './performance-observer.js';

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
      // we test buffered behavior separately
      flushThreshold: 1,
    };

    performance.clearMarks();
    performance.clearMeasures();
  });

  it('creates instance with required options without starting to observe', () => {
    expect(() => new PerformanceObserverSink(options)).not.toThrow();
    expect(MockPerformanceObserver.instances).toHaveLength(0);
  });

  it('creates instance with all options without starting to observe', () => {
    expect(
      () =>
        new PerformanceObserverSink({
          ...options,
          buffered: true,
          flushThreshold: 10,
        }),
    ).not.toThrow();
    expect(MockPerformanceObserver.instances).toHaveLength(0);
  });

  it('subscribe is isomorphic and calls observe on internal PerformanceObserver', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    observer.subscribe();
    expect(MockPerformanceObserver.instances).toHaveLength(1);
    expect(
      MockPerformanceObserver.lastInstance()?.observe,
    ).toHaveBeenCalledTimes(1);
  });

  it('internal PerformanceObserver should observe mark and measure', () => {
    const observer = new PerformanceObserverSink(options);
    observer.subscribe();
    expect(
      MockPerformanceObserver.lastInstance()?.observe,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        entryTypes: ['mark', 'measure'],
      }),
    );
  });

  it('internal PerformanceObserver should observe unbuffered by default', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    expect(
      MockPerformanceObserver.lastInstance()?.observe,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        buffered: false,
      }),
    );
  });

  it('internal PerformanceObserver should observe buffered if buffered option is provided', () => {
    const observer = new PerformanceObserverSink({
      ...options,
      buffered: true,
    });

    observer.subscribe();
    expect(
      MockPerformanceObserver.lastInstance()?.observe,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        buffered: true,
      }),
    );
  });

  it('internal PerformanceObserver should process observed entries', () => {
    const observer = new PerformanceObserverSink({
      ...options,
      flushThreshold: 20, // Disable automatic flushing for this test
    });
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

  it('when observing skips non-mark and non-measure entry types', () => {
    const observer = new PerformanceObserverSink(options);
    observer.subscribe();

    MockPerformanceObserver.lastInstance()?.emitNavigation('test-navigation');
    expect(encode).not.toHaveBeenCalled();
  });

  it('isSubscribed returns false when not observing', () => {
    const observer = new PerformanceObserverSink(options);

    expect(observer.isSubscribed()).toBe(false);
  });

  it('isSubscribed returns true when observing', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    expect(observer.isSubscribed()).toBe(true);
  });

  it('isSubscribed reflects observe disconnect', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    expect(observer.isSubscribed()).toBe(true);
    observer.unsubscribe();
    expect(observer.isSubscribed()).toBe(false);
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

    expect(encode).toHaveBeenCalledWith({
      name: 'test-mark1',
      entryType: 'mark',
      startTime: 0,
      duration: 0,
    });
    expect(encode).toHaveBeenCalledWith({
      name: 'test-mark2',
      entryType: 'mark',
      startTime: 0,
      duration: 0,
    });
  });

  it('flush does not flush observed entries when not subscribed', () => {
    const observer = new PerformanceObserverSink(options);

    performance.mark('test-mark');
    observer.flush();
    expect(encode).not.toHaveBeenCalled();
    expect(sink.getWrittenItems()).toStrictEqual([]);
  });

  it('unsubscribe is isomorphic and calls observe on internal PerformanceObserver', () => {
    const observerSink = new PerformanceObserverSink(options);

    observerSink.subscribe();
    const perfObserver = MockPerformanceObserver.lastInstance();
    observerSink.unsubscribe();
    observerSink.unsubscribe();
    expect(perfObserver?.disconnect).toHaveBeenCalledTimes(1);
    expect(MockPerformanceObserver.instances).toHaveLength(0);
  });
});
