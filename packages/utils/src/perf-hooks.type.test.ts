import {
  type PerformanceEntry,
  type PerformanceMarkOptions,
  type PerformanceMeasureOptions,
  performance,
} from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';

describe('interfaces', () => {
  it('PerformanceMarkOptions should be type safe', () => {
    // Valid complete example
    expect(
      () =>
        ({
          startTime: 0,
          detail: {
            devtools: {
              color: 'error',
              track: 'test-track',
              trackGroup: 'test-trackGroup',
              properties: [['Key', '42']],
              tooltipText: 'test-tooltipText',
            },
          },
        }) satisfies PerformanceMarkOptions,
    ).not.toThrow();
    // Invalid Examples
    expect(
      () =>
        ({
          startTime: 0,
          detail: {
            devtools: {
              // @ts-expect-error - dataType should be marker | track
              dataType: 'markerr',
              // @ts-expect-error - color should be DevToolsColor
              color: 'other',
              // @ts-expect-error - properties should be an array of [string, string]
              properties: { wrong: 'shape' },
            },
          },
        }) satisfies PerformanceMarkOptions,
    ).not.toThrow();
  });

  it('PerformanceMeasureOptions should be type safe', () => {
    // Valid complete example
    expect(
      () =>
        ({
          start: 'start-mark',
          end: 'end-mark',
          detail: {
            devtools: {
              dataType: 'track-entry',
              track: 'test-track',
              color: 'primary',
            },
          },
        }) satisfies PerformanceMeasureOptions,
    ).not.toThrow();
    // Invalid Examples
    expect(
      () =>
        ({
          start: 'start-mark',
          end: 'end-mark',
          detail: {
            devtools: {
              // @ts-expect-error - dataType should be track-entry | marker
              dataType: 'markerr',
              track: 'test-track',
              color: 'primary',
            },
          },
        }) satisfies PerformanceMeasureOptions,
    ).not.toThrow();
  });

  it.todo('PerformanceEntry should be type safe', () => {
    // Valid complete example
    expect(
      () =>
        ({
          name: 'test-entry',
          entryType: 'mark',
          startTime: 0,
          duration: 0,
          toJSON: () => ({}),
          detail: {
            devtools: {
              dataType: 'marker',
              color: 'primary',
            },
          },
        }) satisfies PerformanceEntry,
    ).not.toThrow();
    // Invalid Examples
    expect(
      () =>
        ({
          name: 'test-entry',
          entryType: 'mark',
          startTime: 0,
          duration: 0,
          toJSON: () => ({}),
          detail: {
            devtools: {
              dataType: 'invalid-type', // Should fail
              color: 'invalid-color', // Should fail
              properties: { wrong: 'shape' }, // Should fail
            },
          },
        }) satisfies PerformanceEntry,
    ).not.toThrow();
  });

  it('performance.getEntriesByType returns extended entries', () => {
    const entries = performance.getEntriesByType('mark');

    entries.forEach(e => {
      e.detail?.devtools;
    });
  });
});

describe('API', () => {
  it('performance.mark should be type safe', () => {
    // Valid complete example
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
    // Invalid Examples
    expect(() =>
      performance.mark('name', {
        detail: {
          devtools: {
            // @ts-expect-error - dataType should be marker | track
            dataType: 'markerrr',
            // @ts-expect-error - color should be DevToolsColor
            color: 'invalid-color',
            // @ts-expect-error - properties should be an array of [string, string]
            properties: 'invalid-properties',
          },
        },
      }),
    ).not.toThrow();
  });

  it('performance.measure should be type safe', () => {
    // Create marks for measurement
    performance.mark('start-mark');
    performance.mark('end-mark');

    // Valid examples
    expect(() =>
      performance.measure('measure-name', 'start-mark', 'end-mark'),
    ).not.toThrow();
    expect(() =>
      performance.measure('measure-name', {
        start: 'start-mark',
        end: 'end-mark',
        detail: {
          devtools: {
            dataType: 'track-entry',
            track: 'test-track',
            color: 'primary',
          },
        },
      }),
    ).not.toThrow();
    // Invalid Examples
    expect(() =>
      performance.measure('measure-name', {
        start: 'start-mark',
        end: 'end-mark',
        detail: {
          devtools: {
            // @ts-expect-error - dataType should be track-entry | marker
            dataType: 'invalid-type',
            // @ts-expect-error - color should be DevToolsColor
            color: 'invalid-color',
          },
        },
      }),
    ).not.toThrow();
  });

  it('performance.getEntriesByType should be type safe', () => {
    // Invalid Examples
    expect(() =>
      performance.getEntriesByType('mark').forEach(e => {
        // @ts-expect-error - dataType should be valid
        e.detail?.devtools?.dataType === 'markerr';
      }),
    ).not.toThrow();
  });
});
