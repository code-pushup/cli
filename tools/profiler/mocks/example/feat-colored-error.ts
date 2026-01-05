import { getProfiler } from '../../src/index.js';
import { sequentialWork, work } from '../test-utils.js';

function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'feat-colored-error.ts',
    tracks: {
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

  profiler.measure('cli:collect-command', () => {
    try {
      profiler.measure(
        'core:execute-plugins',
        () =>
          sequentialWork([
            () =>
              profiler.measure(
                'plugin-eslint:execute-runner',
                () =>
                  profiler.measure('plugin-eslint:run-eslint', work, {
                    track: 'Plugins Eslint',
                    color: 'secondary',
                  }),
                {
                  track: 'Plugins Eslint',
                  color: 'secondary-dark',
                },
              ),
            () =>
              profiler.measure(
                'plugin-coverage:execute-runner',
                () => work(true),
                {
                  track: 'Plugins Coverage',
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
      profiler.marker('Error swallowed', {
        color: 'warning',
      });
      return 0;
    }
  });
}
runTest();
throw new Error('Process error simulation');
