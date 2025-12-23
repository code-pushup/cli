import { performance } from 'node:perf_hooks';
import { type ExtendedPerformanceEntry, markToTraceEvent } from '../src';

const a = performance.mark('a');
performance.measure('Random measure', {
  start: a.startTime,
  detail: {
    devtools: {
      dataType: 'track-entry',
      track: 'Image Processing Tasks',
      trackGroup: 'My Tracks', // Group related tracks together
      color: 'tertiary-dark',
      properties: [
        ['Filter Type', 'Gaussian Blur'],
        ['Resize Dimensions', '500x300'],
      ],
      tooltipText: 'Image processed successfully',
    },
  },
});

performance.getEntries().forEach(entry => {
  console.log('Entry:', JSON.stringify(entry));
  console.log(
    'TraceEvent:',
    JSON.stringify(
      markToTraceEvent(entry as PerformanceMark, {
        pid: 1234,
        tid: 5678,
      }),
    ),
  );
});
