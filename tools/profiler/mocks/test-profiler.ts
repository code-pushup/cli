import { performance } from 'node:perf_hooks';
import { Profiler } from '../dist/src/index.js';

const profiler = new Profiler({ enabled: true });

const a = profiler.mark('a');
profiler.measure('Random measure', {
  start: a?.startTime,
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

profiler.flush();

console.log('__isPerfHooksPatchActive', performance?.__isPerfHooksPatchActive);
