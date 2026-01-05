import { getProfiler } from '../../src/index.js';
import { asyncWork, sequentialAsyncWork } from '../test-utils.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: `api-spanAsync-${Date.now()}`,
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
      properties: [
        ['Stack Track', (error as Error)?.stack || 'Unknown'],
        ['Cause', (error as Error)?.cause || 'Unknown'],
      ],
    }),
  });
  profiler.measureAsync('cli:init', () =>
    profiler.measureAsync(
      'core:load-rc-config',
      () =>
        sequentialAsyncWork([
          () =>
            profiler.measureAsync('utils:import-module', asyncWork, {
              color: 'primary-light',
            }),
          () =>
            profiler.measureAsync('models:core-config-parse', asyncWork, {
              color: 'primary-light',
            }),
        ]),
      {
        color: 'primary',
      },
    ),
  );

  await profiler.measureAsync('cli:collect-command', () =>
    profiler.measureAsync(
      'core:execute-plugins',
      () =>
        sequentialAsyncWork([
          () =>
            profiler.measureAsync(
              'plugin-eslint:execute-runner',
              () =>
                profiler.measureAsync('plugin-eslint:run-eslint', asyncWork, {
                  ...profiler.measureConfig.tracks.pluginEslint,
                  color: 'secondary',
                }),
              {
                ...profiler.measureConfig.tracks.pluginEslint,
                color: 'secondary-light',
              },
            ),
          () =>
            profiler.measureAsync('plugin-coverage:execute-runner', asyncWork, {
              ...profiler.measureConfig.tracks.pluginCoverage,
              color: 'secondary-light',
            }),
        ]),
      {
        color: 'primary',
      },
    ),
  );

  await profiler.measureAsync('cli:collect-command-error', async () => {
    try {
      await profiler.measureAsync(
        'core:execute-plugins-error',
        () =>
          sequentialAsyncWork([
            () =>
              profiler.measureAsync(
                'plugin-eslint:execute-runner-error',
                () =>
                  profiler.measureAsync(
                    'plugin-eslint:run-eslint-error',
                    asyncWork,
                    {
                      ...profiler.measureConfig.tracks.pluginEslint,
                      color: 'secondary',
                    },
                  ),
                {
                  ...profiler.measureConfig.tracks.pluginEslint,
                  color: 'secondary-light',
                },
              ),
            () =>
              profiler.measureAsync(
                'plugin-coverage:execute-runner-error',
                () => asyncWork(true),
                {
                  ...profiler.measureConfig.tracks.pluginCoverage,
                  color: 'secondary-light',
                  error: err => ({
                    tooltipText:
                      'An error occurred during coverage plugin execution',
                    properties: [['Date', `${new Date().toISOString()}`]],
                  }),
                },
              ),
          ]),
        {
          color: 'primary',
        },
      );
      return 0;
    } catch (e) {
      return 0;
    }
  });
}
await runTest();
