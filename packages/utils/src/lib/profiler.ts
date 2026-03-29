import { getNodeJSProfiler } from './profiler/profiler-node.js';

export const profiler = getNodeJSProfiler({
  track: 'CLI',
  prefix: 'cp',
  tracks: {
    cli: {
      track: 'CLI',
      trackGroup: 'CLI Group',
      color: 'primary-dark',
    },
  },
});
