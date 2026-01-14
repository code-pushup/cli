import { performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ActionTrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import { Profiler } from './profiler.js';

describe('Profiler Integration', () => {
  let profiler: Profiler<Record<string, ActionTrackEntryPayload>>;

  beforeEach(() => {
    // Clear all performance entries before each test
    performance.clearMarks();
    performance.clearMeasures();

    profiler = new Profiler({
      prefix: 'test',
      track: 'integration-tests',
      color: 'primary',
      tracks: {
        async: { track: 'async-ops', color: 'secondary' },
        sync: { track: 'sync-ops', color: 'tertiary' },
      },
      enabled: true, // Explicitly enable for integration tests
    });
  });

  it('should create complete performance timeline for sync operation', () => {
    const result = profiler.measure('sync-test', () =>
      Array.from({ length: 1000 }, (_, i) => i).reduce(
        (sum, num) => sum + num,
        0,
      ),
    );

    expect(result).toBe(499_500);

    // Verify performance entries were created
    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'test:sync-test:start' }),
        expect.objectContaining({ name: 'test:sync-test:end' }),
      ]),
    );

    expect(measures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'test:sync-test',
          duration: expect.any(Number),
        }),
      ]),
    );
  });

  it('should create complete performance timeline for async operation', async () => {
    const result = await profiler.measureAsync('async-test', async () => {
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'async-result';
    });

    expect(result).toBe('async-result');

    // Verify performance entries were created
    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    expect(marks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'test:async-test:start' }),
        expect.objectContaining({ name: 'test:async-test:end' }),
      ]),
    );

    expect(measures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'test:async-test',
          duration: expect.any(Number),
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

    expect(marks).toHaveLength(4); // 2 for outer + 2 for inner
    expect(measures).toHaveLength(2); // 1 for outer + 1 for inner

    // Check all marks exist
    const markNames = marks.map(m => m.name);
    expect(markNames).toStrictEqual(
      expect.arrayContaining([
        'test:outer:start',
        'test:outer:end',
        'test:inner:start',
        'test:inner:end',
      ]),
    );

    // Check all measures exist
    const measureNames = measures.map(m => m.name);
    expect(measureNames).toStrictEqual(
      expect.arrayContaining(['test:outer', 'test:inner']),
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
    expect(marks).toEqual(
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
    profiler.measure('track-test', () => 'result', {
      success: result => ({
        properties: [['result', result]],
        tooltipText: 'Track test completed',
      }),
    });

    const measures = performance.getEntriesByType('measure');
    expect(measures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'integration-tests',
              color: 'primary',
              properties: [['result', 'result']],
              tooltipText: 'Track test completed',
            }),
          },
        }),
      ]),
    );
  });

  it('should merge track defaults with measurement options', () => {
    // Use the sync track from our configuration
    profiler.measure('sync-op', () => 'sync-result', {
      success: result => ({
        properties: [
          ['operation', 'sync'],
          ['result', result],
        ],
      }),
    });

    const measures = performance.getEntriesByType('measure');
    expect(measures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detail: {
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'integration-tests', // default track
              color: 'primary', // default color
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
    expect(measures).toEqual(
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
    expect(measures).toEqual(
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
    const disabledProfiler = new Profiler({
      prefix: 'disabled',
      track: 'disabled-tests',
      color: 'primary',
      tracks: {},
      enabled: false,
    });

    // Test sync measurement
    const syncResult = disabledProfiler.measure('disabled-sync', () => 'sync');
    expect(syncResult).toBe('sync');

    // Test async measurement
    const asyncResult = disabledProfiler.measureAsync(
      'disabled-async',
      async () => 'async',
    );
    await expect(asyncResult).resolves.toBe('async');

    // Test marker
    disabledProfiler.marker('disabled-marker');

    // Verify no performance entries were created
    expect(performance.getEntriesByType('mark')).toHaveLength(0);
    expect(performance.getEntriesByType('measure')).toHaveLength(0);
  });
});
