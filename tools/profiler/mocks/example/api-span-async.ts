import { getProfiler } from '../../src/index.js';
import { asyncWork, sequentialAsyncWork } from '../test-utils.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: `api-spanAsync-${Date.now()}`,
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
  profiler.spanAsync('cli:init', () =>
    profiler.spanAsync(
      'core:load-rc-config',
      () =>
        sequentialAsyncWork([
          () =>
            profiler.spanAsync('utils:import-module', asyncWork, {
              color: 'primary-light',
            }),
          () =>
            profiler.spanAsync('models:core-config-parse', asyncWork, {
              color: 'primary-light',
            }),
        ]),
      {
        color: 'primary',
      },
    ),
  );

  await profiler.spanAsync('cli:collect-command', () =>
    profiler.spanAsync(
      'core:execute-plugins',
      () =>
        sequentialAsyncWork([
          () =>
            profiler.spanAsync(
              'plugin-eslint:execute-runner',
              () =>
                profiler.spanAsync('plugin-eslint:run-eslint', asyncWork, {
                  track: 'Plugins Eslint',
                  color: 'secondary',
                }),
              {
                track: 'Plugins Eslint',
                color: 'secondary-dark',
              },
            ),
          () =>
            profiler.spanAsync('plugin-coverage:execute-runner', asyncWork, {
              track: 'Plugins Coverage',
              color: 'secondary-dark',
            }),
        ]),
      {
        color: 'primary',
      },
    ),
  );

  await profiler.spanAsync('cli:collect-command-error', async () => {
    try {
      await profiler.spanAsync(
        'core:execute-plugins-error',
        () =>
          sequentialAsyncWork([
            () =>
              profiler.spanAsync(
                'plugin-eslint:execute-runner-error',
                () =>
                  profiler.spanAsync(
                    'plugin-eslint:run-eslint-error',
                    asyncWork,
                    {
                      track: 'Plugins Eslint',
                      color: 'secondary',
                    },
                  ),
                {
                  track: 'Plugins Eslint',
                  color: 'secondary-dark',
                },
              ),
            () =>
              profiler.spanAsync(
                'plugin-coverage:execute-runner-error',
                () => asyncWork(true),
                {
                  track: 'Plugins Coverage',
                  color: 'secondary-dark',
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
await runTest().then(() => {
  // throw new Error('Process error simulation')
});
