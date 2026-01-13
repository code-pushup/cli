import { type PerformanceMarkOptions, performance } from 'node:perf_hooks';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('perf-hooks definitions', () => {
  it('PerformanceMarkOptions should be type safe', () => {
    expect(() =>
      expectTypeOf<{
        startTime: number;
        detail: {
          devtools: {
            dataType: 'marker';
            color: 'error';
          };
        };
      }>().toMatchTypeOf<PerformanceMarkOptions>(),
    ).not.toThrow();

    expect(() =>
      expectTypeOf<{
        startTime: number;
        detail: {
          devtools: {
            dataType: 'markerr';
          };
        };
      }>().not.toMatchTypeOf<PerformanceMarkOptions>(),
    ).not.toThrow();
  });

  it('perf_hooks.mark should be type safe', () => {
    expect(() =>
      performance.mark('name', {
        detail: {
          devtools: {
            dataType: 'marker',
            color: 'error',
          },
        },
      }),
    ).not.toThrow();

    expect(() =>
      performance.mark('name', {
        detail: {
          devtools: {
            // @ts-expect-error - dataType should be marker | track
            dataType: 'markerrr',
            color: 'error',
          },
        },
      }),
    ).not.toThrow();
  });

  it('PerformanceMeasureOptions should be type safe', () => {
    expect(() =>
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
      }>().toMatchTypeOf<PerformanceMeasureOptions>(),
    ).not.toThrow();
  });

  it('perf_hooks.measure should be type safe', () => {
    expect(() =>
      performance.measure('measure-name', 'start-mark', 'end-mark'),
    ).not.toThrow();

    expect(() =>
      performance.measure('measure-name', {
        start: 'start-mark',
        end: 'end-mark',
        detail: {
          // @ts-expect-error - track is required
          devtools: {
            dataType: 'track-entry',
            color: 'primary',
          },
        },
      }),
    ).not.toThrow();
  });
});
