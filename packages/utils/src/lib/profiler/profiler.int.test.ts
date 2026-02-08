import type { ActionTrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import { Profiler } from './profiler.js';

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
    }).toThrowError(error);

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
    }).toThrowError(customError);

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
