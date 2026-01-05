import { getProfiler } from '@code-pushup/profiler';

export { Profiler } from '@code-pushup/profiler';
export const profiler = getProfiler({
  fileName: `code-pushup-cli`,
  tracks: {
    defaultTrack: {
      track: 'CLI',
      trackGroup: '<✓> Code PushUp',
      color: 'primary-dark',
    },
    pluginEslint: {
      track: 'Plugins Eslint',
      color: 'secondary-dark',
    },
    pluginCoverage: {
      track: 'Plugins Coverage',
      color: 'secondary-dark',
    },
  },
  errorHandler: error => ({
    properties: [['Stack Track', (error as Error)?.stack || 'Unknown']],
  }),
});
