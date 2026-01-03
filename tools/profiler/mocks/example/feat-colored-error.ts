import { getProfiler } from '../../src/index.js';
import { sequentialWork, work } from '../test-utils.js';

function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'feat-colored-error.ts',
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

  profiler.span('cli:collect-command', () => {
    try {
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
              profiler.span(
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
      profiler.instantMarker('Error swallowed', {
        color: 'warning',
      });
      return 0;
    }
  });
}
runTest();
throw new Error('Process error simulation');
