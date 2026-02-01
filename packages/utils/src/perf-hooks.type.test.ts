import {
  type PerformanceEntry,
  type PerformanceMarkOptions,
  type PerformanceMeasureOptions,
  PerformanceObserver,
  performance,
} from 'perf_hooks';
import type { DetailPayloadWithDevtools } from './lib/user-timing-extensibility-api.type';

// interfaces: PerformanceMarkOptions should be type safe
// Valid complete example
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
}) satisfies PerformanceMarkOptions;
// Invalid examples
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
}) satisfies PerformanceMarkOptions;

// interfaces: PerformanceMeasureOptions should be type safe
// Valid complete example
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
}) satisfies PerformanceMeasureOptionsWithDevtools;
// Invalid examples
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
}) satisfies PerformanceMeasureOptionsWithDevtools;

// interfaces: PerformanceEntry should be type safe (todo)
// Valid complete example
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
}) satisfies PerformanceEntryWithDevtools;
// Invalid examples
({
  name: 'test-entry',
  entryType: 'mark',
  startTime: 0,
  duration: 0,
  toJSON: () => ({}),
  detail: {
    devtools: {
      // @ts-expect-error - dataType should be valid
      dataType: 'invalid-type',
      // @ts-expect-error - color should be DevToolsColor
      color: 'invalid-color',
      // @ts-expect-error - properties should be an array of [string, string]
      properties: { wrong: 'shape' },
    },
  },
}) satisfies PerformanceEntryWithDevtools;

// interfaces: performance.getEntriesByType returns extended entries
const entries = performance.getEntriesByType('mark');

entries.forEach(e => {
  e.detail?.devtools;
});

// API: performance.mark should be type safe
// Valid complete example
performance.mark('name', {
  detail: {
    devtools: {
      dataType: 'marker',
      color: 'error',
    },
  },
});
// Invalid examples
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
});

// API: performance.measure should be type safe
// Create marks for measurement
performance.mark('start-mark');
performance.mark('end-mark');

// Valid examples
performance.measure('measure-name', 'start-mark', 'end-mark');
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
});
// Invalid examples
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
});

// API: performance.getEntriesByType should be type safe
// Valid examples
performance.getEntriesByType('mark').forEach(e => {
  e.detail?.devtools?.dataType === 'marker';
});
// Invalid examples
performance.getEntriesByType('mark').forEach(e => {
  // @ts-expect-error - dataType should be valid
  e.detail?.devtools?.dataType === 'markerr';
});

// API: performance.getEntriesByName should be type safe
// Valid examples
performance.getEntriesByName('name', 'mark').forEach(e => {
  e.detail?.devtools?.dataType === 'marker';
});
// Invalid examples
performance.getEntriesByName('name', 'mark').forEach(e => {
  // @ts-expect-error - dataType should be valid
  e.detail?.devtools?.dataType === 'markerr';
});

// API: performance.getEntries should be type safe
// Valid examples
performance.getEntries().forEach(e => {
  e.detail?.devtools?.dataType === 'marker';
});
// Invalid examples
performance.getEntries().forEach(e => {
  // @ts-expect-error - dataType should be valid
  e.detail?.devtools?.dataType === 'markerr';
});

// API: PerformanceObserver.takeRecords should be type safe
const observerRecords = new PerformanceObserver(
  () => {},
).takeRecords() as PerformanceEntryWithDevtools[];
// Valid examples
observerRecords.forEach(e => {
  e.detail?.devtools?.dataType === 'marker';
});
// Invalid examples
observerRecords.forEach(e => {
  // @ts-expect-error - dataType should be valid
  e.detail?.devtools?.dataType === 'markerr';
});

// API: performance.clearMarks should be type safe
// Valid examples
performance.clearMarks();
// Invalid examples
performance.clearMarks('name');

// API: performance.clearMeasures should be type safe
// Valid examples
performance.clearMeasures();
// Invalid examples
