import { type PerformanceMarkOptions, performance } from 'node:perf_hooks';
import { describe, expectTypeOf, it } from 'vitest';

describe('perf-hooks definitions', () => {
  it('PerformanceMarkOptions should be type safe', () => {
    expectTypeOf<{
      startTime: number;
      detail: {
        devtools: {
          dataType: 'marker';
          color: 'error';
        };
      };
    }>().toMatchTypeOf<PerformanceMarkOptions>();
    expectTypeOf<{
      startTime: number;
      detail: {
        devtools: {
          dataType: 'markerr';
        };
      };
    }>().not.toMatchTypeOf<PerformanceMarkOptions>();
  });

  it('perf_hooks.mark should be type safe', () => {
    performance.mark('name', {
      detail: {
        devtools: {
          dataType: 'marker',
          color: 'error',
        },
      },
    });

    performance.mark('name', {
      detail: {
        devtools: {
          /* @ts-expect-error - dataType should be marker | track */
          dataType: 'markerrr',
          color: 'error',
        },
      },
    });
  });

  it('PerformanceMeasureOptions should be type safe', () => {
    expectTypeOf<{
      start: string;
      end: string;
      detail: {
        devtools: {
          dataType: 'track-entry';
          track: 'test-track';
          color: 'primary';
        };
      };
    }>().toMatchTypeOf<PerformanceMeasureOptions>();
  });

  it('perf_hooks.measure should be type safe', () => {
    performance.measure('measure-name', 'start-mark', 'end-mark');

    performance.measure('measure-name', {
      start: 'start-mark',
      end: 'end-mark',
      detail: {
        /* @ts-expect-error - track is required */
        devtools: {
          dataType: 'track-entry',
          color: 'primary',
        },
      },
    });
  });
});
