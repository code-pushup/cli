import type { ActionTrackConfigs } from '../user-timing-extensibility-api-utils';
import { Profiler, type ProfilerOptions } from './profiler.js';

describe('Profiler Integration', () => {
  function profiler(opt?: ProfilerOptions): Profiler<ActionTrackConfigs> {
    return new Profiler({
      ...opt,
      prefix: 'cp',
      track: 'CLI',
      trackGroup: 'Code Pushup',
      tracks: {
        utils: { track: 'Utils', color: 'primary' },
      },
      enabled: true,
    });
  }

  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
  });

  it('should create complete performance timeline for sync operation', () => {
    const p = profiler();
    expect(
      p.measure('sync-test', () =>
        Array.from({ length: 1000 }, (_, i) => i).reduce(
          (sum, num) => sum + num,
          0,
        ),
      ),
    ).toBe(499_500);

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');
  });

  it('should create complete performance timeline for async operation', async () => {
    const p = profiler();
    await expect(
      p.measureAsync('async-test', async () => {
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
    const p = profiler();
    p.measure('outer', () => {
      p.measure('inner', () => 'inner-result');
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
    const p = profiler();
    p.marker('test-marker', {
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
    const p = profiler();
    p.measure('track-test', (): string => 'result', {
      success: result => ({
        track: 'Track 1',
        trackGroup: 'Group 1',
        color: 'secondary-dark',
        properties: [['secondary', result]],
        tooltipText: 'Track test secondary',
      }),
    });

    const measures = performance.getEntriesByType('measure');
    expect(measures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cp:track-test',
          detail: expect.objectContaining({
            devtools: expect.objectContaining({
              dataType: 'track-entry',
              track: 'Track 1',
              trackGroup: 'Group 1',
              color: 'secondary-dark',
              properties: [['secondary', 'result']],
              tooltipText: 'Track test secondary',
            }),
          }),
        }),
      ]),
    );
  });

  it('should not create performance entries when disabled', async () => {
    const p = profiler();
    p.setEnabled(false);

    const syncResult = p.measure('disabled-sync', () => 'sync');
    expect(syncResult).toBe('sync');

    const asyncResult = p.measureAsync('disabled-async', async () => 'async');
    await expect(asyncResult).resolves.toBe('async');

    p.marker('disabled-marker');

    expect(performance.getEntriesByType('mark')).toHaveLength(0);
    expect(performance.getEntriesByType('measure')).toHaveLength(0);
  });
});
