import { beforeEach, describe, expect, it } from 'vitest';
import { MockTraceEventFileSink } from '../../../mocks/sink.mock.js';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import type { ActionTrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import { NodejsProfiler, Profiler } from './profiler.js';

describe('Profiler Integration', () => {
  let profiler: Profiler<Record<string, ActionTrackEntryPayload>>;

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();

    profiler = new Profiler({
      prefix: 'cp',
      track: 'CLI',
      trackGroup: 'Code Pushup',
      color: 'primary-dark',
      tracks: {
        utils: { track: 'Utils', color: 'primary' },
        core: { track: 'Core', color: 'primary-light' },
      },
      enabled: true,
    });
  });

  it('should create complete performance timeline for sync operation', () => {
    expect(
      profiler.measure('sync-test', () =>
        Array.from({ length: 1000 }, (_, i) => i).reduce(
          (sum, num) => sum + num,
          0,
        ),
      ),
    ).toBe(499_500);

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:sync-test:start',
          detail: expect.objectContaining({
            devtools: expect.objectContaining({ dataType: 'track-entry' }),
          }),
        }),
        expect.objectContaining({
          name: 'cp:sync-test:end',
          detail: expect.objectContaining({
            devtools: expect.objectContaining({ dataType: 'track-entry' }),
          }),
        }),
      ]),
    );

    expect(measures).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:sync-test',
          duration: expect.any(Number),
          detail: expect.objectContaining({
            devtools: expect.objectContaining({ dataType: 'track-entry' }),
          }),
        }),
      ]),
    );
  });

  it('should create complete performance timeline for async operation', async () => {
    await expect(
      profiler.measureAsync('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      }),
    ).resolves.toBe('async-result');

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:async-test:start',
          detail: expect.objectContaining({
            devtools: expect.objectContaining({ dataType: 'track-entry' }),
          }),
        }),
        expect.objectContaining({
          name: 'cp:async-test:end',
          detail: expect.objectContaining({
            devtools: expect.objectContaining({ dataType: 'track-entry' }),
          }),
        }),
      ]),
    );

    expect(measures).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:async-test',
          duration: expect.any(Number),
          detail: expect.objectContaining({
            devtools: expect.objectContaining({ dataType: 'track-entry' }),
          }),
        }),
      ]),
    );
  });

  it('should handle nested measurements correctly', () => {
    profiler.measure('outer', () => {
      profiler.measure('inner', () => 'inner-result');
      return 'outer-result';
    });

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toHaveLength(4);
    expect(measures).toHaveLength(2);

    const markNames = marks.map(m => m.name);
    expect(markNames).toStrictEqual(
      expect.arrayContaining([
        'cp:outer:start',
        'cp:outer:end',
        'cp:inner:start',
        'cp:inner:end',
      ]),
    );

    const measureNames = measures.map(m => m.name);
    expect(measureNames).toStrictEqual(
      expect.arrayContaining(['cp:outer', 'cp:inner']),
    );
  });

  it('should create markers with proper metadata', () => {
    profiler.marker('test-marker', {
      color: 'warning',
      tooltipText: 'Test marker tooltip',
      properties: [
        ['event', 'test-event'],
        ['timestamp', Date.now()],
      ],
    });

    const marks = performance.getEntriesByType('mark');
    expect(marks).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'test-marker',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'marker',
              color: 'warning',
              tooltipText: 'Test marker tooltip',
              properties: [
                ['event', 'test-event'],
                ['timestamp', expect.any(Number)],
              ],
            }),
          },
        }),
      ]),
    );
  });

  it('should create proper DevTools payloads for tracks', () => {
    profiler.measure('track-test', (): string => 'result', {
      success: result => ({
        properties: [['result', result]],
        tooltipText: 'Track test completed',
      }),
    });

    const measures = performance.getEntriesByType('measure');
    expect(measures).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:track-test',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'CLI',
              trackGroup: 'Code Pushup',
              color: 'primary-dark',
              properties: [['result', 'result']],
              tooltipText: 'Track test completed',
            }),
          },
        }),
      ]),
    );
  });

  it('should merge track defaults with measurement options', () => {
    profiler.measure('sync-op', () => 'sync-result', {
      success: result => ({
        properties: [
          ['operation', 'sync'],
          ['result', result],
        ],
      }),
    });

    const measures = performance.getEntriesByType('measure');
    expect(measures).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:sync-op',
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'CLI',
              trackGroup: 'Code Pushup',
              color: 'primary-dark',
              properties: [
                ['operation', 'sync'],
                ['result', 'sync-result'],
              ],
            }),
          },
        }),
      ]),
    );
  });

  it('should mark errors with red color in DevTools', () => {
    const error = new Error('Test error');

    expect(() => {
      profiler.measure('error-test', () => {
        throw error;
      });
    }).toThrow(error);

    const measures = performance.getEntriesByType('measure');
    expect(measures).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detail: {
            devtools: expect.objectContaining({
              color: 'error',
              properties: expect.arrayContaining([
                ['Error Type', 'Error'],
                ['Error Message', 'Test error'],
              ]),
            }),
          },
        }),
      ]),
    );
  });

  it('should include error metadata in DevTools properties', () => {
    const customError = new TypeError('Custom type error');

    expect(() => {
      profiler.measure('custom-error-test', () => {
        throw customError;
      });
    }).toThrow(customError);

    const measures = performance.getEntriesByType('measure');
    expect(measures).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detail: {
            devtools: expect.objectContaining({
              properties: expect.arrayContaining([
                ['Error Type', 'TypeError'],
                ['Error Message', 'Custom type error'],
              ]),
            }),
          },
        }),
      ]),
    );
  });

  it('should not create performance entries when disabled', async () => {
    profiler.setEnabled(false);

    const syncResult = profiler.measure('disabled-sync', () => 'sync');
    expect(syncResult).toBe('sync');

    const asyncResult = profiler.measureAsync(
      'disabled-async',
      async () => 'async',
    );
    await expect(asyncResult).resolves.toBe('async');

    profiler.marker('disabled-marker');

    expect(performance.getEntriesByType('mark')).toHaveLength(0);
    expect(performance.getEntriesByType('measure')).toHaveLength(0);
  });
});

describe('NodeJS Profiler Integration', () => {
  const simpleEncoder: PerformanceEntryEncoder<string> = entry => {
    if (entry.entryType === 'measure') {
      return [`${entry.name}:${entry.duration.toFixed(2)}ms`];
    }
    return [];
  };

  let mockSink: MockTraceEventFileSink;
  let nodejsProfiler: NodejsProfiler<string>;

  beforeEach(() => {
    mockSink = new MockTraceEventFileSink();

    nodejsProfiler = new NodejsProfiler({
      prefix: 'test',
      track: 'test-track',
      sink: mockSink,
      encodePerfEntry: simpleEncoder,
      enabled: true,
    });
  });

  it('should initialize with sink opened when enabled', () => {
    expect(mockSink.isClosed()).toBe(false);
    expect(nodejsProfiler.isEnabled()).toBe(true);
    expect(mockSink.open).toHaveBeenCalledTimes(1);
  });

  it('should create performance entries and write to sink', () => {
    expect(nodejsProfiler.measure('test-operation', () => 'success')).toBe(
      'success',
    );
  });

  it('should handle async operations', async () => {
    await expect(
      nodejsProfiler.measureAsync('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return 'async-result';
      }),
    ).resolves.toBe('async-result');
  });

  it('should disable profiling and close sink', () => {
    nodejsProfiler.setEnabled(false);
    expect(nodejsProfiler.isEnabled()).toBe(false);
    expect(mockSink.isClosed()).toBe(true);
    expect(mockSink.close).toHaveBeenCalledTimes(1);

    expect(nodejsProfiler.measure('disabled-test', () => 'success')).toBe(
      'success',
    );

    expect(mockSink.getWrittenItems()).toHaveLength(0);
  });

  it('should re-enable profiling correctly', () => {
    nodejsProfiler.setEnabled(false);
    nodejsProfiler.setEnabled(true);

    expect(nodejsProfiler.isEnabled()).toBe(true);
    expect(mockSink.isClosed()).toBe(false);
    expect(mockSink.open).toHaveBeenCalledTimes(2);

    expect(nodejsProfiler.measure('re-enabled-test', () => 42)).toBe(42);
  });

  it('should support custom tracks', () => {
    const profilerWithTracks = new NodejsProfiler({
      prefix: 'api-server',
      track: 'HTTP',
      tracks: {
        db: { track: 'Database', color: 'secondary' },
        cache: { track: 'Cache', color: 'primary' },
      },
      sink: mockSink,
      encodePerfEntry: simpleEncoder,
    });

    expect(
      profilerWithTracks.measure('user-lookup', () => 'user123', {
        track: 'cache',
      }),
    ).toBe('user123');
  });

  it('should capture buffered entries when buffered option is enabled', () => {
    const bufferedProfiler = new NodejsProfiler({
      prefix: 'buffered-test',
      track: 'Test',
      sink: mockSink,
      encodePerfEntry: simpleEncoder,
      captureBufferedEntries: true,
      enabled: true,
    });

    const bufferedStats = bufferedProfiler.stats;
    expect(bufferedStats.state).toBe('running');
    expect(bufferedStats.walOpen).toBe(true);
    expect(bufferedStats.isSubscribed).toBe(true);
    expect(bufferedStats.queued).toBe(0);
    expect(bufferedStats.dropped).toBe(0);
    expect(bufferedStats.written).toBe(0);

    bufferedProfiler.setEnabled(false);
  });

  it('should return correct getStats with dropped and written counts', () => {
    const statsProfiler = new NodejsProfiler({
      prefix: 'stats-test',
      track: 'Stats',
      sink: mockSink,
      encodePerfEntry: simpleEncoder,
      maxQueueSize: 2,
      flushThreshold: 2,
      enabled: true,
    });

    expect(statsProfiler.measure('test-op', () => 'result')).toBe('result');

    const stats = statsProfiler.stats;
    expect(stats.state).toBe('running');
    expect(stats.walOpen).toBe(true);
    expect(stats.isSubscribed).toBe(true);
    expect(typeof stats.queued).toBe('number');
    expect(typeof stats.dropped).toBe('number');
    expect(typeof stats.written).toBe('number');

    statsProfiler.setEnabled(false);
  });

  it('should provide comprehensive queue statistics via getStats', () => {
    const profiler = new NodejsProfiler({
      prefix: 'stats-profiler',
      track: 'Stats',
      sink: mockSink,
      encodePerfEntry: simpleEncoder,
      maxQueueSize: 3,
      flushThreshold: 2,
      enabled: true,
    });

    const initialStats = profiler.stats;
    expect(initialStats.state).toBe('running');
    expect(initialStats.walOpen).toBe(true);
    expect(initialStats.isSubscribed).toBe(true);
    expect(initialStats.queued).toBe(0);
    expect(initialStats.dropped).toBe(0);
    expect(initialStats.written).toBe(0);

    profiler.measure('operation-1', () => 'result1');
    profiler.measure('operation-2', () => 'result2');
    profiler.flush();
    expect(profiler.stats.written).toBe(0);

    profiler.setEnabled(false);

    const finalStats = profiler.stats;
    expect(finalStats.state).toBe('idle');
    expect(finalStats.walOpen).toBe(false);
    expect(finalStats.isSubscribed).toBe(false);
    expect(finalStats.queued).toBe(0);
  });
});
