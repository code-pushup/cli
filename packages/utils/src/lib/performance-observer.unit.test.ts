import { type PerformanceEntry, performance } from 'node:perf_hooks';
import type { MockedFunction } from 'vitest';
import { MockPerformanceObserver } from '@code-pushup/test-utils';
import { MockAppendableSink } from '../../mocks/sink.mock';
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
  let sink: MockAppendableSink;
  let options: PerformanceObserverOptions<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    sink = new MockAppendableSink();
    sink.open();
    encodePerfEntry = vi.fn((entry: PerformanceEntry) => [
      `${entry.name}:${entry.entryType}`,
    ]);
    options = {
      sink,
      encodePerfEntry,
      flushThreshold: 1,
      debug: false,
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
          debug: false,
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
          debug: false,
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
    ).toHaveBeenCalledOnce();
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

  it('internal PerformanceObserver should process observed entries', () => {
    const observer = new PerformanceObserverSink({
      ...options,
      flushThreshold: 20,
    });
    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('test-mark');
    mockObserver?.triggerObserverCallback();
    performance.measure('test-measure');
    // measure() automatically triggers observers, so no need to call triggerObserverCallback again
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

    const mockObserver = MockPerformanceObserver.lastInstance();
    // eslint-disable-next-line functional/immutable-data
    MockPerformanceObserver.globalEntries.push({
      name: 'test-navigation',
      entryType: 'navigation',
      startTime: 0,
      duration: 0,
    } as unknown as PerformanceEntry);
    mockObserver?.triggerObserverCallback();
    expect(encodePerfEntry).not.toHaveBeenCalled();
  });

  it('isSubscribed returns false when not observing', () => {
    const observer = new PerformanceObserverSink(options);

    expect(observer.isSubscribed()).toBeFalse();
  });

  it('isSubscribed returns true when observing', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    expect(observer.isSubscribed()).toBeTrue();
  });

  it('isSubscribed reflects observe disconnect', () => {
    const observer = new PerformanceObserverSink(options);

    observer.subscribe();
    expect(observer.isSubscribed()).toBeTrue();
    observer.unsubscribe();
    expect(observer.isSubscribed()).toBeFalse();
  });

  it('flush writes queued entries to sink when subscribed', () => {
    const observer = new PerformanceObserverSink({
      ...options,
      flushThreshold: 10,
    });
    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('test-mark1');
    performance.mark('test-mark2');
    mockObserver?.triggerObserverCallback();
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
    performance.mark('test-mark1');
    performance.mark('test-mark2');
    mockObserver?.triggerObserverCallback();

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
      debug: false,
    });

    expect(() => observer.flush()).not.toThrow();
    expect(() => observer.flush()).not.toThrow();
    expect(sink.getWrittenItems()).toStrictEqual([]);
  });

  it('flush is safe when sink is closed', async () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      flushThreshold: 10,
      debug: false,
    });
    sink.open();
    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('mark-1');
    mockObserver?.triggerObserverCallback();

    await new Promise(resolve => {
      setTimeout(() => resolve(0), 0);
    });
    sink.close();

    expect(() => observer.flush()).not.toThrow();
    expect(() => observer.flush()).not.toThrow();
    expect(observer.getStats()).toHaveProperty('queued', 1);

    observer.unsubscribe();
  });

  it('unsubscribe is idempotent and calls disconnect on internal PerformanceObserver', () => {
    const observerSink = new PerformanceObserverSink(options);

    observerSink.subscribe();
    const perfObserver = MockPerformanceObserver.lastInstance();
    observerSink.unsubscribe();
    observerSink.unsubscribe();
    expect(perfObserver?.disconnect).toHaveBeenCalledOnce();
    expect(MockPerformanceObserver.instances).toHaveLength(0);
  });

  it('captures buffered entries only once, even after unsubscribe/resubscribe', () => {
    const observer = new PerformanceObserverSink({
      ...options,
      captureBufferedEntries: true,
      flushThreshold: 10,
    });

    performance.mark('buffered-mark-1');
    performance.mark('buffered-mark-2');
    performance.measure(
      'buffered-measure-1',
      'buffered-mark-1',
      'buffered-mark-2',
    );

    observer.subscribe();
    observer.flush();

    expect(encodePerfEntry).toHaveBeenCalledTimes(3);

    encodePerfEntry.mockClear();
    observer.unsubscribe();
    observer.subscribe();
    observer.flush();

    expect(encodePerfEntry).not.toHaveBeenCalled();
  });

  it('handles encodePerfEntry errors gracefully and drops items', () => {
    const failingEncode = vi.fn(() => {
      throw new Error('Encode failed');
    });

    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry: failingEncode,
      flushThreshold: 10,
      debug: false,
    });

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('test-mark');
    expect(() => mockObserver?.triggerObserverCallback()).not.toThrow();

    const stats = observer.getStats();
    expect(stats.dropped).toBe(1);
    expect(stats.queued).toBe(0);
  });

  describe('debug mode', () => {
    it('creates performance mark when encode fails and debug mode is enabled', () => {
      const failingEncode = vi.fn(() => {
        throw new Error('EncodeError');
      });

      const observer = new PerformanceObserverSink({
        sink,
        encodePerfEntry: failingEncode,
        flushThreshold: 10,
        debug: true,
      });

      observer.subscribe();

      const mockObserver = MockPerformanceObserver.lastInstance();
      performance.mark('test-entry');
      mockObserver?.triggerObserverCallback();

      const marks = performance.getEntriesByType('mark');
      const errorMark = marks.find(mark =>
        mark.name.startsWith('encode-error:'),
      );
      expect(errorMark).toBeDefined();
      expect(errorMark?.name).toBe('encode-error:Error:test-entry');

      const stats = observer.getStats();
      expect(stats.dropped).toBe(1);
    });

    it('does not create performance mark when encode fails and debug mode is disabled', () => {
      const failingEncode = vi.fn(() => {
        throw new Error('EncodeError');
      });

      const observer = new PerformanceObserverSink({
        sink,
        encodePerfEntry: failingEncode,
        flushThreshold: 10,
        debug: false,
      });

      performance.clearMarks();
      observer.subscribe();

      const mockObserver = MockPerformanceObserver.lastInstance();
      performance.mark('test-entry');
      mockObserver?.triggerObserverCallback();

      const marks = performance.getEntriesByType('mark');
      const errorMark = marks.find(mark =>
        mark.name.startsWith('encode-error:'),
      );
      expect(errorMark).toBeUndefined();

      const stats = observer.getStats();
      expect(stats.dropped).toBe(1);
    });

    it('handles encode errors for unnamed entries correctly', () => {
      const failingEncode = vi.fn(() => {
        throw new Error('EncodeError');
      });

      const observer = new PerformanceObserverSink({
        sink,
        encodePerfEntry: failingEncode,
        flushThreshold: 10,
        debug: true,
      });

      observer.subscribe();

      const mockObserver = MockPerformanceObserver.lastInstance();
      performance.mark('');
      mockObserver?.triggerObserverCallback();

      const marks = performance.getEntriesByType('mark');
      const errorMark = marks.find(mark =>
        mark.name.startsWith('encode-error:'),
      );
      expect(errorMark).toBeDefined();
      expect(errorMark?.name).toBe('encode-error:Error:unnamed');
    });

    it('handles non-Error objects thrown from encode function', () => {
      const failingEncode = vi.fn(() => {
        throw 'String error';
      });

      const observer = new PerformanceObserverSink({
        sink,
        encodePerfEntry: failingEncode,
        flushThreshold: 10,
        debug: true,
      });

      observer.subscribe();

      const mockObserver = MockPerformanceObserver.lastInstance();
      performance.mark('test-entry');
      mockObserver?.triggerObserverCallback();

      const marks = performance.getEntriesByType('mark');
      const errorMark = marks.find(mark =>
        mark.name.startsWith('encode-error:'),
      );
      expect(errorMark).toBeDefined();
      expect(errorMark?.name).toBe('encode-error:UnknownError:test-entry');

      const stats = observer.getStats();
      expect(stats.dropped).toBe(1);
    });
  });

  it('continues processing other entries after encode failure', () => {
    let callCount = 0;
    const failingEncode = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('First encode failed');
      }
      return [`entry-${callCount}:mark`];
    });

    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry: failingEncode,
      flushThreshold: 10,
      debug: false,
    });

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('failing-entry');
    performance.mark('successful-entry');
    mockObserver?.triggerObserverCallback();

    observer.flush();

    const stats = observer.getStats();
    expect(stats.dropped).toBe(1);
    expect(stats.written).toBe(1);
    expect(sink.getWrittenItems()).toStrictEqual(['entry-2:mark']);
  });

  it('flush handles sink write errors internally and keeps failed items in queue', () => {
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
      debug: false,
    });

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('test-mark');
    mockObserver?.triggerObserverCallback();

    const statsBefore = observer.getStats();
    expect(statsBefore.dropped).toBe(0);
    expect(statsBefore.queued).toBe(1);

    // flush should not throw, but failed items stay in queue for retry
    expect(() => observer.flush()).not.toThrow();

    const statsAfter = observer.getStats();
    expect(statsAfter.dropped).toBe(0); // Items not dropped, kept for retry
    expect(statsAfter.queued).toBe(1); // Failed item stays in queue
  });

  it('getStats returns dropped and queued item information', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      maxQueueSize: 20,
      flushThreshold: 10,
      debug: false,
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
      debug: false,
    });

    observer.subscribe();
    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('start-operation');
    mockObserver?.triggerObserverCallback();

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
      debug: false,
    });

    const flushSpy = vi.spyOn(observer, 'flush').mockImplementation(() => {});

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('mark-1');
    performance.mark('mark-2');
    performance.mark('mark-3');
    mockObserver?.triggerObserverCallback();

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
      debug: false,
    });

    observer.subscribe();
    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('write-test-1');
    performance.mark('write-test-2');
    performance.mark('write-test-3');
    mockObserver?.triggerObserverCallback();
    observer.flush();

    expect(observer.getStats()).toStrictEqual(
      expect.objectContaining({
        written: 3,
      }),
    );
  });

  it('accepts custom sinks with append method', () => {
    const collectedItems: string[] = [];
    const customSink = {
      // eslint-disable-next-line functional/immutable-data
      append: (item: string) => collectedItems.push(item),
      isClosed: () => false,
      recover: () => ({
        records: [],
        errors: [],
        partialTail: null,
      }),
      repack: () => {},
    };

    const observer = new PerformanceObserverSink({
      sink: customSink,
      encodePerfEntry: (entry: PerformanceEntry) => [
        `${entry.name}:${entry.duration}`,
      ],
      debug: false,
    });

    observer.subscribe();

    const mockObserver = MockPerformanceObserver.lastInstance();
    performance.mark('test-mark');
    mockObserver?.triggerObserverCallback();

    observer.flush();

    expect(collectedItems).toContain('test-mark:0');
  });

  it('tracks addedSinceLastFlush counter correctly', () => {
    const observer = new PerformanceObserverSink({
      sink,
      encodePerfEntry,
      flushThreshold: 10,
      debug: false,
    });

    expect(observer.getStats().addedSinceLastFlush).toBe(0);

    observer.subscribe();
    const mockObserver = MockPerformanceObserver.lastInstance();

    performance.mark('test-1');
    mockObserver?.triggerObserverCallback();

    expect(observer.getStats().addedSinceLastFlush).toBe(1);

    performance.mark('test-2');
    mockObserver?.triggerObserverCallback();

    // triggerObserverCallback processes all entries in globalEntries, including previously processed ones
    // So it processes both test-1 and test-2, adding 2 items (total 3 including the previous one)
    expect(observer.getStats().addedSinceLastFlush).toBe(3);

    observer.flush();
    expect(observer.getStats().addedSinceLastFlush).toBe(0);

    performance.mark('test-3');
    performance.mark('test-4');
    mockObserver?.triggerObserverCallback();

    // triggerObserverCallback processes all entries in globalEntries, including previously processed ones
    // So after flush, we have test-1, test-2, test-3, test-4 all in globalEntries
    // When callback is triggered, it processes all 4 entries, adding 4 items to queue
    expect(observer.getStats()).toHaveProperty('addedSinceLastFlush', 4);

    observer.unsubscribe();
  });

  describe('debug getter', () => {
    it('returns false when debug is disabled', () => {
      const observer = new PerformanceObserverSink({
        ...options,
        debug: false,
      });

      expect(observer.debug).toBeFalse();
    });

    it('returns true when debug is enabled', () => {
      const observer = new PerformanceObserverSink({
        ...options,
        debug: true,
      });

      expect(observer.debug).toBeTrue();
    });

    it('returns false when debug is disabled via options', () => {
      const observer = new PerformanceObserverSink({
        ...options,
        debug: false,
      });

      expect(observer.debug).toBeFalse();
    });
  });
});
