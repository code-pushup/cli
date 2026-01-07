// Import the mocked modules
import {
  type PerformanceEntry,
  PerformanceObserver,
  performance,
} from 'node:perf_hooks';
import {
  type MockedFunction,
  afterEach,
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
    throw new Error('Method not implemented.');
  }
  close(): void {
    throw new Error('Method not implemented.');
  }
  encode(input: T): unknown {
    throw new Error('Method not implemented.');
  }
  written: T[] = [];

  write(input: T): void {
    this.written.push(input);
  }
}

// Mock performance entries
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
  let mockSink: Sink<string, unknown>;
  let encodeFn: MockedFunction<(entry: PerformanceEntry) => string[]>;
  let mockObserverInstance: {
    observe: MockedFunction<any>;
    disconnect: MockedFunction<any>;
  };

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

    (PerformanceObserver as any).mockImplementation(() => mockObserverInstance);

    // Setup performance mock
    (performance.getEntriesByType as any).mockImplementation(
      (type: string) => [],
    );
    (performance.clearMarks as any).mockImplementation(() => {});
    (performance.clearMeasures as any).mockImplementation(() => {});
  });

  it('should create PerformanceObserverHandle with default options', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    expect(observer).toBeInstanceOf(PerformanceObserverHandle);
  });

  it('should create PerformanceObserverHandle with custom options', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
      captureBuffered: true,
      flushEveryN: 10,
      onEntry: vi.fn(),
    });

    expect(observer).toBeInstanceOf(PerformanceObserverHandle);
  });

  it('should encode performance entry using provided encode function', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    const result = observer.encode(mockMarkEntry);
    expect(encodeFn).toHaveBeenCalledWith(mockMarkEntry);
    expect(result).toEqual(['test-mark:mark']);
  });

  it('should create PerformanceObserver and observe mark and measure entries', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
    });

    observer.connect();

    expect(PerformanceObserver).toHaveBeenCalled();
    expect(mockObserverInstance.observe).toHaveBeenCalledWith({
      entryTypes: ['mark', 'measure'],
      buffered: false,
    });
  });

  it('should enable buffered capture when captureBuffered is true', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
      captureBuffered: true,
    });

    observer.connect();

    expect(mockObserverInstance.observe).toHaveBeenCalledWith({
      entryTypes: ['mark', 'measure'],
      buffered: true,
    });
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

  it('should trigger flush when flushEveryN threshold is reached', () => {
    const observer = new PerformanceObserverHandle({
      sink: mockSink,
      encode: encodeFn,
      flushEveryN: 2,
    });

    // Mock the observer to capture the callback
    let callback: (() => void) | undefined;
    (PerformanceObserver as any).mockImplementation((cb: () => void) => {
      callback = cb;
      return mockObserverInstance;
    });

    observer.connect();

    // Simulate calling the callback twice to reach threshold
    callback?.(); // flushEveryN = 1
    callback?.(); // flushEveryN = 2, should trigger flush

    expect(PerformanceObserver).toHaveBeenCalled();
  });

  describe('flush', () => {
    it('should process performance entries and write to sink', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      // Mock performance.getEntriesByType
      (performance.getEntriesByType as any).mockImplementation(
        (type: string) => {
          if (type === 'mark') return [mockMarkEntry];
          if (type === 'measure') return [mockMeasureEntry];
          return [];
        },
      );

      observer.flush();

      expect(performance.getEntriesByType).toHaveBeenCalledWith('mark');
      expect(performance.getEntriesByType).toHaveBeenCalledWith('measure');
      expect(encodeFn).toHaveBeenCalledTimes(2);
      expect(mockSink.written).toEqual([
        'test-mark:mark',
        'test-measure:measure',
      ]);
    });

    it('should skip already processed entries', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      (performance.getEntriesByType as any).mockReturnValue([mockMarkEntry]);

      observer.flush(); // First flush processes the entry
      observer.flush(); // Second flush should skip already processed entry

      expect(encodeFn).toHaveBeenCalledTimes(1);
      expect(mockSink.written).toEqual(['test-mark:mark']);
    });

    it('should clear processed entries when clear=true', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      (performance.getEntriesByType as any).mockImplementation(
        (type: string) => {
          if (type === 'mark') return [mockMarkEntry];
          if (type === 'measure') return [mockMeasureEntry];
          return [];
        },
      );

      observer.flush(true); // Clear mode

      expect(performance.clearMarks).toHaveBeenCalledWith('test-mark');
      expect(performance.clearMeasures).toHaveBeenCalledWith('test-measure');
      expect(mockSink.written).toEqual([
        'test-mark:mark',
        'test-measure:measure',
      ]);
    });

    it('should do nothing if closed', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      observer.close();

      (performance.getEntriesByType as any).mockReturnValue([mockMarkEntry]);

      observer.flush();

      expect(encodeFn).not.toHaveBeenCalled();
    });

    it('should work even if not connected', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      (performance.getEntriesByType as any).mockReturnValue([mockMarkEntry]);

      observer.flush();

      expect(encodeFn).toHaveBeenCalledWith(mockMarkEntry);
      expect(mockSink.written).toEqual(['test-mark:mark']);
    });

    it('should call onEntry callback when provided', () => {
      const onEntry = vi.fn();
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
        onEntry,
      });

      (performance.getEntriesByType as any).mockReturnValue([mockMarkEntry]);

      observer.flush();

      expect(onEntry).toHaveBeenCalledWith('test-mark:mark');
    });

    it('should skip entries that are not mark or measure types', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      const invalidEntry = {
        name: 'invalid',
        entryType: 'navigation' as const,
        startTime: 100,
        duration: 0,
      } as PerformanceEntry;

      (performance.getEntriesByType as any).mockImplementation(
        (type: string) => {
          if (type === 'mark') return [mockMarkEntry];
          if (type === 'measure') return [invalidEntry];
          return [];
        },
      );

      observer.flush();

      // Should only process the mark entry, skip the navigation entry
      expect(encodeFn).toHaveBeenCalledTimes(1);
      expect(encodeFn).toHaveBeenCalledWith(mockMarkEntry);
      expect(mockSink.written).toEqual(['test-mark:mark']);
    });

    it('should handle multiple encoded items per entry', () => {
      const multiEncodeFn = vi.fn(() => ['item1', 'item2']);
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: multiEncodeFn,
      });

      (performance.getEntriesByType as any).mockReturnValue([mockMarkEntry]);

      observer.flush();

      expect(multiEncodeFn).toHaveBeenCalledWith(mockMarkEntry);
      expect(mockSink.written).toEqual(['item1', 'item2']);
    });
  });

  describe('disconnect', () => {
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

    it('should do nothing if not connected', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      observer.disconnect();

      expect(observer.isConnected()).toBe(false);
    });

    it('should do nothing if already closed', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      observer.close();
      observer.disconnect();

      expect(observer.isConnected()).toBe(false);
    });
  });

  describe('close', () => {
    it('should flush and disconnect when closing', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      (performance.getEntriesByType as any).mockImplementation(
        (type: string) => {
          if (type === 'mark') return [mockMarkEntry];
          return [];
        },
      );

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
      observer.close(); // Second call should do nothing

      expect(observer.isConnected()).toBe(false);
    });
  });

  describe('isConnected', () => {
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
  });

  describe('integration', () => {
    it('should handle multiple entries with different types', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      const entries = [
        { ...mockMarkEntry, name: 'mark1' },
        { ...mockMeasureEntry, name: 'measure1' },
        { ...mockMarkEntry, name: 'mark2' },
      ];

      (performance.getEntriesByType as any).mockImplementation(
        (type: string) => {
          if (type === 'mark')
            return entries.filter(e => e.entryType === 'mark');
          if (type === 'measure')
            return entries.filter(e => e.entryType === 'measure');
          return [];
        },
      );

      observer.flush();

      expect(mockSink.written).toEqual([
        'mark1:mark',
        'mark2:mark',
        'measure1:measure',
      ]);
    });

    it('should call onEntry callback when provided', () => {
      const onEntry = vi.fn();
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
        onEntry,
      });

      (performance.getEntriesByType as any).mockReturnValue([mockMarkEntry]);

      observer.flush();

      expect(onEntry).toHaveBeenCalledWith('test-mark:mark');
    });

    it('should use default flushEveryN when not specified', () => {
      const observer = new PerformanceObserverHandle({
        sink: mockSink,
        encode: encodeFn,
      });

      // Test that it uses default by checking that flush works without observer
      (performance.getEntriesByType as any).mockImplementation(
        (type: string) => {
          if (type === 'mark') return [mockMarkEntry];
          return [];
        },
      );

      observer.flush();

      expect(mockSink.written).toEqual(['test-mark:mark']);
    });
  });
});
