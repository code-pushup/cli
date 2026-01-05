import { getProfiler } from '../../src/index.js';
import { sequentialWork, work } from '../test-utils.js';

const trackGroup = '<✓> Code PushUp';
const profiler = getProfiler({
  enabled: true,
  fileBaseName: `api-span-${Date.now()}`,
  tracks: {
    defaultTrack: {
      track: 'CLI',
      trackGroup,
      color: 'primary-dark',
    },
    pluginEslint: {
      track: 'Plugins Eslint',
      trackGroup,
      color: 'secondary',
    },
    pluginCoverage: {
      track: 'Plugins Coverage',
      trackGroup,
      color: 'secondary-dark',
    },
  },
  errorHandler: error => ({
    properties: [
      ['Stack Track', (error as Error)?.stack || 'Unknown'],
      ['Cause', (error as Error)?.cause || 'Unknown'],
    ],
  }),
});

profiler.measure('cli:init', () =>
  profiler.measure(
    'core:load-rc-config',
    () =>
      sequentialWork([
        () =>
          profiler.measure('utils:import-module', work, {
            color: 'primary-light',
          }),
        () =>
          profiler.measure('models:core-config-parse', work, {
            color: 'primary-light',
          }),
      ]),
    {
      color: 'primary',
    },
  ),
);

profiler.measure('cli:collect-command', () =>
  profiler.measure('core:execute-plugins', () =>
    sequentialWork([
      () =>
        profiler.measure(
          'plugin-eslint:execute-runner',
          () =>
            profiler.measure('plugin-eslint:run-eslint', work, {
              ...profiler.measureConfig.tracks.pluginEslint,
              color: 'secondary',
            }),
          {
            ...profiler.measureConfig.tracks.pluginEslint,
            color: 'secondary-dark',
          },
        ),
      () =>
        profiler.measure('plugin-coverage:execute-runner', work, {
          ...profiler.measureConfig.tracks.pluginCoverage,
          color: 'secondary-dark',
        }),
    ]),
  ),
);

profiler.measure('cli:collect-command-error', () => {
  try {
    profiler.measure(
      'core:execute-plugins-error',
      () =>
        sequentialWork([
          () =>
            profiler.measure(
              'plugin-eslint:execute-runner-error',
              () =>
                profiler.measure('plugin-eslint:run-eslint-error', work, {
                  ...profiler.measureConfig.tracks.pluginEslint,
                  color: 'secondary',
                }),
              {
                ...profiler.measureConfig.tracks.pluginEslint,
                color: 'secondary-dark',
              },
            ),
          () =>
            profiler.measure(
              'plugin-coverage:execute-runner-error',
              () => work(true),
              {
                ...profiler.measureConfig.tracks.pluginCoverage,
                color: 'tertiary',
              },
            ),
        ]),
      {
        color: 'primary',
        error: err => ({
          tooltipText: 'An error occurred during coverage plugin execution',
          properties: [['Stack Track', `${(err as Error).stack}`]],
        }),
      },
    );
    return 0;
  } catch (e) {
    console.log('Error caught silently');
    return 0;
  }
});
