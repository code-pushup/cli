import {
  type EntryType,
  type PerformanceEntry,
  PerformanceObserver,
  performance,
} from 'node:perf_hooks';
import {
  type MockedFunction,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { PerformanceObserverHandle } from './performance-observer.js';
import type { Sink } from './sink-source.types';

vi.mock('node:perf_hooks', () => ({
  performance: {
    getEntriesByType: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  },
  PerformanceObserver: vi.fn(),
}));

class MockSink<T> implements Sink<T, unknown> {
  open(): void {
    throw new Error(`Method not implemented in ${this.constructor.name}.`);
  }

  close(): void {
    throw new Error(`Method not implemented in ${this.constructor.name}.`);
  }

  encode(_input: T): unknown {
    throw new Error(`Method not implemented in ${this.constructor.name}.`);
  }

  written: T[] = [];

  write(input: T): void {
    this.written.push(input);
  }
}

const mockMarkEntry = {
  name: 'test-mark',
  entryType: 'mark' as const,
  startTime: 100,
  duration: 0,
} as PerformanceEntry;

const mockMeasureEntry = {
  name: 'test-measure',
  entryType: 'measure' as const,
  startTime: 200,
  duration: 50,
} as PerformanceEntry;

describe('PerformanceObserverHandle', () => {
  const getEntriesByTypeSpy = vi.spyOn(performance, 'getEntriesByType');
  let mockObserverInstance: {
    observe: MockedFunction<any>;
    disconnect: MockedFunction<any>;
  };
  let mockSink: MockSink<string>;
  let encodeFn: MockedFunction<(entry: PerformanceEntry) => string[]>;

  beforeEach(() => {
    mockSink = new MockSink<string>();
    encodeFn = vi.fn((entry: PerformanceEntry) => [
      `${entry.name}:${entry.entryType}`,
    ]);

    mockObserverInstance = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };

    vi.clearAllMocks();

    getEntriesByTypeSpy.mockImplementation((type: string) => {
      if (type === 'mark') return [mockMarkEntry];
      if (type === 'measure') return [mockMeasureEntry];
      return [];
    });

    (PerformanceObserver as any).mockImplementation(() => mockObserverInstance);
  });

  it('should create PerformanceObserverHandle with default options', () => {
    expect(
      () =>
        new PerformanceObserverHandle({
          sink: mockSink,
          encode: encodeFn,
        }),
    ).not.toThrow();
  });

  it('should create PerformanceObserverHandle with custom options', () => {
    expect(
      () =>
        new PerformanceObserverHandle({
          sink: mockSink,
          encode: encodeFn,
          captureBuffered: true,
          flushThreshold: 10,
        }),
    ).not.toThrow();
  });

  it('should encode performance entry using provided encode function', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    expect(observer.encode(mockMarkEntry)).toEqual(['test-mark:mark']);
    expect(encodeFn).toHaveBeenCalledWith(mockMarkEntry);
  });

  it('should observe mark and measure entries on connect', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();

    expect(PerformanceObserver).toHaveBeenCalled();
    expect(mockObserverInstance.observe).toHaveBeenCalledWith(
      expect.objectContaining({
        entryTypes: ['mark', 'measure'],
      }),
    );
  });

  it('should observe buffered mark and measure entries on connect when captureBuffered is true', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
      captureBuffered: true,
    });

    observer.connect();

    expect(mockObserverInstance.observe).toHaveBeenCalledWith(
      expect.objectContaining({
        buffered: true,
      }),
    );
  });

  it('should not create observer if already connected', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();
    observer.connect();

    expect(PerformanceObserver).toHaveBeenCalledTimes(1);
  });

  it('should not create observer if closed', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.close();
    observer.connect();

    expect(PerformanceObserver).not.toHaveBeenCalled();
  });

  it('should call encode on flush', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();
    observer.flush();

    expect(encodeFn).toHaveBeenCalled();
  });

  it('should trigger flush when flushThreshold is reached', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
      flushThreshold: 2,
    });

    getEntriesByTypeSpy.mockImplementation((type: string) => {
      if (type === 'mark') return [mockMarkEntry];
      if (type === 'measure') return [mockMeasureEntry];
      return [];
    });

    let observedTrigger: (() => void) | undefined;
    (PerformanceObserver as any).mockImplementation((cb: () => void) => {
      observedTrigger = cb;
      return mockObserverInstance;
    });

    observer.connect();

    observedTrigger?.();
    observedTrigger?.();

    expect(encodeFn).toHaveBeenCalledTimes(2);
  });

  it('should process performance entries and write to sink', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.flush();

    expect(getEntriesByTypeSpy).toHaveBeenCalledWith('mark');
    expect(getEntriesByTypeSpy).toHaveBeenCalledWith('measure');
    expect(encodeFn).toHaveBeenCalledTimes(2);
    expect(mockSink.written).toStrictEqual([
      'test-mark:mark',
      'test-measure:measure',
    ]);
  });

  it('should clear processed entries when clear=true', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.flush(true);

    expect(performance.clearMarks).toHaveBeenCalledWith('test-mark');
    expect(performance.clearMeasures).toHaveBeenCalledWith('test-measure');
    expect(mockSink.written).toStrictEqual([
      'test-mark:mark',
      'test-measure:measure',
    ]);
  });

  it('should do nothing if closed', () => {
    getEntriesByTypeSpy.mockReturnValue([]);

    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.close();
    observer.flush();

    expect(encodeFn).not.toHaveBeenCalled();
  });

  it('should work even if not connected', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.flush();

    expect(encodeFn).toHaveBeenCalledWith(mockMarkEntry);
    expect(mockSink.written).toStrictEqual([
      'test-mark:mark',
      'test-measure:measure',
    ]);
  });

  it('should skip entries that are not mark or measure types', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    const invalidEntry = {
      name: 'invalid',
      entryType: 'navigation' as EntryType,
      startTime: 100,
      duration: 0,
      toJSON(): any {},
    };

    getEntriesByTypeSpy.mockImplementation((type: string) => {
      if (type === 'mark') return [mockMarkEntry];
      if (type === 'measure') return [invalidEntry];
      return [];
    });

    observer.flush();

    expect(encodeFn).toHaveBeenCalledTimes(1);
    expect(encodeFn).toHaveBeenCalledWith(mockMarkEntry);
    expect(mockSink.written).toStrictEqual(['test-mark:mark']);
  });

  it('should handle multiple encoded items per entry', () => {
    const multiEncodeFn = vi.fn(() => ['item1', 'item2']);
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: multiEncodeFn,
    });

    getEntriesByTypeSpy.mockImplementation((type: string) => {
      if (type === 'mark') return [mockMarkEntry];
      return [];
    });

    observer.flush();

    expect(multiEncodeFn).toHaveBeenCalledWith(mockMarkEntry);
    expect(mockSink.written).toStrictEqual(['item1', 'item2']);
  });

  it('should disconnect PerformanceObserver', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();
    observer.disconnect();

    expect(mockObserverInstance.disconnect).toHaveBeenCalled();
    expect(observer.isConnected()).toBe(false);
  });

  it('should do nothing if not connected and disconnect is called', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.disconnect();

    expect(observer.isConnected()).toBe(false);
  });

  it('should do nothing if already closed and disconnect is called', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.close();
    observer.disconnect();

    expect(observer.isConnected()).toBe(false);
  });

  it('should flush and disconnect when closing', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();
    observer.close();

    expect(encodeFn).toHaveBeenCalledWith(mockMarkEntry);
    expect(mockObserverInstance.disconnect).toHaveBeenCalled();
    expect(observer.isConnected()).toBe(false);
  });

  it('should do nothing if already closed', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.close();
    observer.close();

    expect(observer.isConnected()).toBe(false);
  });

  it('should return true when connected', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    expect(observer.isConnected()).toBe(false);

    observer.connect();

    expect(observer.isConnected()).toBe(true);
  });

  it('should return false when disconnected', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();
    observer.disconnect();

    expect(observer.isConnected()).toBe(false);
  });

  it('should return false when closed', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();
    observer.close();

    expect(observer.isConnected()).toBe(false);
  });

  it('should return false when closed even if observer exists', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();
    observer.close();

    expect(observer.isConnected()).toBe(false);
  });

  it('should use default flushEveryN when not specified', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.flush();

    expect(mockSink.written).toStrictEqual([
      'test-mark:mark',
      'test-measure:measure',
    ]);
  });
});
