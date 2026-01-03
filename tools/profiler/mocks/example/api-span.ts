import { getProfiler } from '../../src/index.js';
import { sequentialWork, work } from '../test-utils.js';

const profiler = getProfiler({
  enabled: true,
  fileBaseName: `api-span-${Date.now()}`,
  devtools: {
    defaultTrack: {
      track: 'CLI',
      trackGroup: '<✓> Code PushUp',
      color: 'primary-dark',
    },
    errorHandler: error => ({
      properties: [
        ['Stack Track', (error as Error)?.stack || 'Unknown'],
        ['Cause', (error as Error)?.cause || 'Unknown'],
      ],
    }),
  },
});
profiler.span('cli:init', () =>
  profiler.span(
    'core:load-rc-config',
    () =>
      sequentialWork([
        () =>
          profiler.span('utils:import-module', work, {
            color: 'primary-light',
          }),
        () =>
          profiler.span('models:core-config-parse', work, {
            color: 'primary-light',
          }),
      ]),
    {
      color: 'primary',
    },
  ),
);

profiler.span('cli:collect-command', () =>
  profiler.span(
    'core:execute-plugins',
    () =>
      sequentialWork([
        () =>
          profiler.span(
            'plugin-eslint:execute-runner',
            () =>
              profiler.span('plugin-eslint:run-eslint', work, {
                track: 'Plugins Eslint',
                color: 'secondary',
              }),
            {
              track: 'Plugins Eslint',
              color: 'secondary-dark',
            },
          ),
        () =>
          profiler.span('plugin-coverage:execute-runner', work, {
            track: 'Plugins Coverage',
            color: 'secondary-dark',
          }),
      ]),
    {
      color: 'primary',
    },
  ),
);

profiler.span('cli:collect-command-error', () => {
  try {
    profiler.span(
      'core:execute-plugins-error',
      () =>
        sequentialWork([
          () =>
            profiler.span(
              'plugin-eslint:execute-runner-error',
              () =>
                profiler.span('plugin-eslint:run-eslint-error', work, {
                  track: 'Plugins Eslint',
                  color: 'secondary',
                }),
              {
                track: 'Plugins Eslint',
                color: 'secondary-dark',
              },
            ),
          () =>
            profiler.span(
              'plugin-coverage:execute-runner-error',
              () => work(true),
              {
                track: 'Plugins Coverage',
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
