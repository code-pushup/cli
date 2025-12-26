import { Profiler } from '../dist/src/index.js';

const profiler = new Profiler({
  enabled: true,
  spans: {
    loadConfig: {
      track: 'CLI Commands',
      group: 'My Tracks',
      color: 'primary-dark',
    },
  } as const,
});

const a = profiler.mark('a', {
  detail: {
    ...profiler.spans.loadConfig({
      properties: [
        ['Filter Type', 'Gaussian Blur'],
        ['Resize Dimensions', '500x300'],
      ],
      tooltipText: 'Image processed successfully',
    }),
  },
});

profiler.measure('Random measure', a);

profiler.flush();
