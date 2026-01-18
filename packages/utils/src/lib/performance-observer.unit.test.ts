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
  DEFAULT_FLUSH_THRESHOLD,
  DEFAULT_MAX_QUEUE_SIZE,
  type PerformanceObserverOptions,
  PerformanceObserverSink,
  validateFlushThreshold,
} from './performance-observer.js';

describe('validateFlushThreshold', () => {
  it.each([
    { flushThreshold: 1, description: 'minimum valid value (1)' },
    { flushThreshold: 10, description: 'arbitrary valid value (10)' },
    {
      flushThreshold: DEFAULT_FLUSH_THRESHOLD,
      description: 'default flush threshold',
    },
    {
      flushThreshold: DEFAULT_MAX_QUEUE_SIZE,
      description: 'maximum valid value (equals maxQueueSize)',
    },
  ])(
    'accepts valid flushThreshold value: $description',
    ({ flushThreshold }) => {
      expect(() =>
        validateFlushThreshold(flushThreshold, DEFAULT_MAX_QUEUE_SIZE),
      ).not.toThrow();
    },
  );

  it.each([
    { flushThreshold: 0, expectedError: 'flushThreshold must be > 0' },
    { flushThreshold: -1, expectedError: 'flushThreshold must be > 0' },
    { flushThreshold: -10, expectedError: 'flushThreshold must be > 0' },
    {
      flushThreshold: DEFAULT_MAX_QUEUE_SIZE + 1,
      expectedError: 'flushThreshold must be <= maxQueueSize',
    },
    {
      flushThreshold: 20_000,
      expectedError: 'flushThreshold must be <= maxQueueSize',
    },
  ])(
    'throws error when flushThreshold is invalid: $flushThreshold',
    ({ flushThreshold, expectedError }) => {
      expect(() =>
        validateFlushThreshold(flushThreshold, DEFAULT_MAX_QUEUE_SIZE),
      ).toThrow(expectedError);
    },
  );
});

describe('PerformanceObserverSink', () => {
  let encodePerfEntry: MockedFunction<(entry: PerformanceEntry) => string[]>;
  let sink: MockSink;
  let options: PerformanceObserverOptions<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    sink = new MockSink();
    sink.open();
    encodePerfEntry = vi.fn((entry: PerformanceEntry) => [
      `${entry.name}:${entry.entryType}`,
    ]);
    options = {
      sink,
      encodePerfEntry,
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
          encodePerfEntry,
        }),
    ).not.toThrow();
    expect(MockPerformanceObserver.instances).toHaveLength(0);
  });

  it('creates instance with all options without starting to observe', () => {
    expect(
      () =>
        new PerformanceObserverSink({
          ...options,
          captureBufferedEntries: true,
          flushThreshold: 10,
        }),
    ).not.toThrow();
    expect(MockPerformanceObserver.instances).toHaveLength(0);
  });

  it.each([
    { flushThreshold: 0, expectedError: 'flushThreshold must be > 0' },
    { flushThreshold: -1, expectedError: 'flushThreshold must be > 0' },
    {
      flushThreshold: 10_001,
      expectedError: 'flushThreshold must be <= maxQueueSize',
    },
  ])(
    'throws error when flushThreshold is invalid: $flushThreshold',
    ({ flushThreshold, expectedError }) => {
      expect(
        () =>
          new PerformanceObserverSink({
            ...options,
            flushThreshold,
          }),
      ).toThrow(expectedError);
    },
  );

  it('subscribe is idempotent and calls observe on internal PerformanceObserver', () => {
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

  it('internal PerformanceObserver should observe buffered by default', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    expect(
      MockPerformanceObserver.lastInstance()?.observe,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        buffered: true,
      }),
    );
  });

  it('internal PerformanceObserver should observe buffered if buffered option is provided', () => {
    const observer = new PerformanceObserverSink({
      ...options,
      captureBufferedEntries: true,
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
      flushThreshold: 20,
    });
    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'test-mark',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'test-measure',
        entryType: 'measure',
        startTime: 0,
        duration: 100,
      },
    ]);
    observer.flush();
    expect(encodePerfEntry).toHaveBeenCalledTimes(2);
    expect(encodePerfEntry).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'test-mark',
        entryType: 'mark',
      }),
    );
    expect(encodePerfEntry).toHaveBeenNthCalledWith(
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
    expect(encodePerfEntry).not.toHaveBeenCalled();
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

  it('flush writes queued entries to sink when subscribed', () => {
    const observer = new PerformanceObserverSink({
      ...options,
      flushThreshold: 10,
    });
    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'test-mark1',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'test-mark2',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);
    expect(sink.getWrittenItems()).toStrictEqual([]);

    observer.flush();
    expect(sink.getWrittenItems()).toStrictEqual([
      'test-mark1:mark',
      'test-mark2:mark',
    ]);
  });

  it('flush does not flush observed entries when not subscribed', () => {
    const observer = new PerformanceObserverSink(options);

    performance.mark('test-mark');
    observer.flush();
    expect(encodePerfEntry).not.toHaveBeenCalled();
    expect(sink.getWrittenItems()).toStrictEqual([]);
  });

  it('flush calls encodePerfEntry for each entry', () => {
    const observer = new PerformanceObserverSink(options);
    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'test-mark1',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'test-mark2',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    observer.flush();

    expect(encodePerfEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-mark1',
        entryType: 'mark',
      }),
    );
    expect(encodePerfEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-mark2',
        entryType: 'mark',
      }),
    );
  });

  it('flush is idempotent and safe when queue is empty', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
    });

    expect(() => observer.flush()).not.toThrow();
    expect(() => observer.flush()).not.toThrow();
    expect(sink.getWrittenItems()).toStrictEqual([]);
  });

  it('flush is safe when sink is closed', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      flushThreshold: 10,
    });

    observer.subscribe();
    performance.mark('test-mark');
    sink.close();

    expect(() => observer.flush()).not.toThrow();
    expect(() => observer.flush()).not.toThrow();

    observer.unsubscribe();
  });

  it('unsubscribe is idempotent and calls disconnect on internal PerformanceObserver', () => {
    const observerSink = new PerformanceObserverSink(options);

    observerSink.subscribe();
    const perfObserver = MockPerformanceObserver.lastInstance();
    observerSink.unsubscribe();
    observerSink.unsubscribe();
    expect(perfObserver?.disconnect).toHaveBeenCalledTimes(1);
    expect(MockPerformanceObserver.instances).toHaveLength(0);
  });

  it('observer callback throws encodePerfEntry errors immediately', () => {
    const failingEncode = vi.fn(() => {
      throw new Error('Encode failed');
    });

    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry: failingEncode,
      flushThreshold: 10,
    });

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    expect(() =>
      mockObserver?.emit([
        {
          name: 'test-mark',
          entryType: 'mark',
          startTime: 0,
          duration: 0,
        },
      ]),
    ).toThrow('Encode failed');
  });

  it('flush wraps sink write errors with descriptive error message', () => {
    const failingSink = {
      write: vi.fn(() => {
        throw new Error('Sink write failed');
      }),
      isClosed: vi.fn(() => false),
    };

    const observer = new PerformanceObserverSink({
      sink: failingSink as any,
      encodePerfEntry,
      flushThreshold: 10,
    });

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'test-mark',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    expect(() => observer.flush()).toThrow(
      expect.objectContaining({
        message: 'PerformanceObserverSink failed to write items to sink.',
        cause: expect.objectContaining({
          message: 'Sink write failed',
        }),
      }),
    );
  });

  it('throws error when subscribing with sink that is not open', () => {
    const closedSink = new MockSink();
    const observer = new PerformanceObserverSink({
      sink: closedSink,
      encodePerfEntry,
    });

    expect(() => observer.subscribe()).toThrow(
      'Sink MockSink must be opened before subscribing PerformanceObserver',
    );
  });

  it('getStats returns dropped and queued item information', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      maxQueueSize: 20,
      flushThreshold: 10,
    });

    expect(observer.getStats()).toStrictEqual(
      expect.objectContaining({
        queued: 0,
        dropped: 0,
      }),
    );
  });

  it('getStats returns correct queue item count', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      flushThreshold: 10,
    });

    observer.subscribe();
    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'start-operation',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    expect(observer.getStats()).toStrictEqual(
      expect.objectContaining({
        queued: 1,
      }),
    );
  });

  it('getStats returns correct dropped count when queue overflows', () => {
    const smallQueueSize = 2;
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      maxQueueSize: smallQueueSize,
      flushThreshold: smallQueueSize,
    });

    const flushSpy = vi.spyOn(observer, 'flush').mockImplementation(() => {});

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'mark-1',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'mark-2',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'mark-3',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    expect(observer.getStats()).toStrictEqual(
      expect.objectContaining({
        queued: 2,
        dropped: 1,
      }),
    );

    flushSpy.mockRestore();
    observer.unsubscribe();
  });
  it('getStats returns correct written count when queue overflows', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      flushThreshold: 2,
    });

    observer.subscribe();
    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'write-test-1',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'write-test-2',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'write-test-3',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);
    observer.flush();

    expect(observer.getStats()).toStrictEqual(
      expect.objectContaining({
        written: 3,
      }),
    );
  });

  it('tracks addedSinceLastFlush counter correctly', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      flushThreshold: 10,
    });

    expect(observer.getStats().addedSinceLastFlush).toBe(0);

    observer.subscribe();
    const mockObserver = MockPerformanceObserver.lastInstance();

    mockObserver?.emit([
      {
        name: 'test-1',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    expect(observer.getStats().addedSinceLastFlush).toBe(1);

    mockObserver?.emit([
      {
        name: 'test-2',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    expect(observer.getStats().addedSinceLastFlush).toBe(2);

    observer.flush();
    expect(observer.getStats().addedSinceLastFlush).toBe(0);

    mockObserver?.emit([
      {
        name: 'test-3',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'test-4',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    expect(observer.getStats()).toHaveProperty('addedSinceLastFlush', 2);

    observer.unsubscribe();
  });

  it('observer callback clears queue when sink closes during observation', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      flushThreshold: 10, // High threshold to prevent automatic flushing
    });

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'test-entry-1',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    // Verify entry is queued
    expect(observer.getStats().queued).toBe(1);

    // Close the sink while observer is still active
    sink.close();

    // Emit another entry - the callback should detect closed sink and clear queue
    mockObserver?.emit([
      {
        name: 'test-entry-2',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    // Queue should be cleared due to closed sink in callback
    expect(observer.getStats().queued).toBe(0);

    observer.unsubscribe();
  });

  it('clears queue without writing when sink is closed during flush', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      flushThreshold: 10, // High threshold to prevent automatic flushing
    });

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    mockObserver?.emit([
      {
        name: 'test-entry-1',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
      {
        name: 'test-entry-2',
        entryType: 'mark',
        startTime: 0,
        duration: 0,
      },
    ]);

    // Verify entries are queued
    expect(observer.getStats().queued).toBe(2);
    expect(observer.getStats().written).toBe(0);

    // Close the sink
    sink.close();

    // Flush should clear queue without writing
    observer.flush();

    // Verify queue is cleared but written count unchanged
    expect(observer.getStats().queued).toBe(0);
    expect(observer.getStats().written).toBe(0);

    // Verify sink received no additional writes
    expect(sink.getWrittenItems()).toHaveLength(0);

    observer.unsubscribe();
  });
});
