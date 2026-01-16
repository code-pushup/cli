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
import { MockFileSink } from '../../mocks/sink.mock';
import {
  type PerformanceObserverOptions,
  PerformanceObserverSink,
} from './performance-observer.js';

describe('PerformanceObserverSink', () => {
  let encode: MockedFunction<(entry: PerformanceEntry) => string[]>;
  let sink: MockFileSink;
  let options: PerformanceObserverOptions<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    sink = new MockFileSink();
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

  it('creates instance with default flushThreshold when not provided', () => {
    expect(
      () =>
        new PerformanceObserverSink({
          sink,
          encode,
        }),
    ).not.toThrow();
    expect(MockPerformanceObserver.instances).toHaveLength(0);
    // Instance creation covers the default flushThreshold assignment
  });

  it('automatically flushes when pendingCount reaches flushThreshold', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encode,
      flushThreshold: 2, // Set threshold to 2
    });
    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();

    // Emit 1 entry - should not trigger flush yet (pendingCount = 1 < 2)
    mockObserver?.emitMark('first-mark');
    expect(sink.getWrittenItems()).toStrictEqual([]);

    // Emit 1 more entry - should trigger flush (pendingCount = 2 >= 2)
    mockObserver?.emitMark('second-mark');
    expect(sink.getWrittenItems()).toStrictEqual([
      'first-mark:mark',
      'second-mark:mark',
    ]);
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

  it('flush wraps sink write errors with descriptive error message', () => {
    const failingSink = {
      write: vi.fn(() => {
        throw new Error('Sink write failed');
      }),
    };

    const observer = new PerformanceObserverSink({
      sink: failingSink as any,
      encode,
      flushThreshold: 1,
    });

    observer.subscribe();

    performance.mark('test-mark');

    expect(() => observer.flush()).toThrow(
      expect.objectContaining({
        message: 'PerformanceObserverSink failed to write items to sink.',
        cause: expect.objectContaining({
          message: 'Sink write failed',
        }),
      }),
    );
  });

  it('flush wraps encode errors with descriptive error message', () => {
    const failingEncode = vi.fn(() => {
      throw new Error('Encode failed');
    });

    const observer = new PerformanceObserverSink({
      sink,
      encode: failingEncode,
      flushThreshold: 1,
    });

    observer.subscribe();

    performance.mark('test-mark');

    expect(() => observer.flush()).toThrow(
      expect.objectContaining({
        message: 'PerformanceObserverSink failed to write items to sink.',
        cause: expect.objectContaining({
          message: 'Encode failed',
        }),
      }),
    );
  });
});
