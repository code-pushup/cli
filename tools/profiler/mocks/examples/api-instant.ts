import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../dist/src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'api-instant',
  });

  profiler.instant('instant');
  await sleep(10);

  profiler.instant('instant-details', {
    detail: {
      str: 'This is a detail property',
      num: 42,
      obj: {
        num: 42,
      },
      array: [42, 42, 42],
    },
  });

  await sleep(10);

  profiler.instant('instant-details-error', {
    detail: {
      devtools: {
        dataType: 'marker', // required for error rendering
        color: 'error', // required for error rendering
        properties: [
          ['Error Type', 'ValidationError'],
          ['Error Message', 'Invalid input data provided'],
        ],
        tooltipText: 'ValidationError: Invalid input data provided',
      },
    },
  });

  await sleep(10);

  profiler.instant('instant-details-devtools', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Program',
        trackGroup: 'Main Process',
        color: 'primary',
        properties: [
          ['str', 'This is a detail.devtools property'],
          ['num', 42],
          ['object', { str: '42', num: 42 }],
          ['array', [42, 42, 42]],
        ],
        tooltipText: 'This is a tooltip text for the mark',
      },
    },
  });

  await sleep(10);

  profiler.instant('instant-details-devtools-error', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Program',
        trackGroup: 'Main Process',
        color: 'error', // required for error rendering
        properties: [
          ['Error Type', 'ValidationError'],
          ['Error Message', 'Invalid input data provided'],
        ],
        tooltipText: 'ValidationError: Invalid input data provided',
      },
    },
  });

  await sleep(10);

  // New settlePromise pattern for instant marks
  const instantWork = () => {
    const value = Math.random() * 100;
    if (value > 50) {
      return { success: true, value };
    } else {
      throw new Error(`Value ${value.toFixed(2)} is too low`);
    }
  };

  profiler.instant('instant-work-success', {
    work: instantWork,
    optionsOrFn: settled => ({
      detail: {
        devtools: {
          dataType: 'marker',
          color: settled.status === 'fulfilled' ? 'primary' : 'error',
          properties:
            settled.status === 'fulfilled'
              ? [
                  ['Result', 'Success'],
                  ['Value', settled.value.value.toFixed(2)],
                ]
              : [
                  ['Result', 'Error'],
                  ['Error', settled.reason.message],
                ],
          tooltipText:
            settled.status === 'fulfilled'
              ? `Success: ${settled.value.value.toFixed(2)}`
              : `Error: ${settled.reason.message}`,
        },
      },
    }),
  });

  await sleep(10);

  // Example that will likely fail
  try {
    profiler.instant('instant-work-error', {
      work: () => {
        throw new Error('This instant work always fails');
      },
      optionsOrFn: settled => ({
        detail: {
          devtools: {
            dataType: 'marker',
            color: 'error',
            properties: [
              ['Result', 'Error'],
              ['Error', settled.reason.message],
            ],
            tooltipText: `Error: ${settled.reason.message}`,
          },
        },
      }),
    });
  } catch (e) {
    // Expected error
  }

  await sleep(10);

  // Example of instant with callback options (success case)
  const instantResult = profiler.instant(
    'instant-work-success-with-options',
    () => {
      const value = Math.random() * 100;
      if (value > 50) {
        return { success: true, value };
      } else {
        throw new Error(`Value ${value.toFixed(2)} is too low`);
      }
    },
    {
      onSuccess: result => ({
        detail: {
          devtools: {
            dataType: 'marker',
            color: 'primary',
            properties: [
              ['Result', 'Success'],
              ['Value', result.value.toFixed(2)],
            ],
            tooltipText: `Success: ${result.value.toFixed(2)}`,
          },
        },
      }),
      onError: error => ({
        detail: {
          devtools: {
            dataType: 'marker',
            color: 'error',
            properties: [
              ['Result', 'Error'],
              ['Error', (error as Error).message],
            ],
            tooltipText: `Error: ${(error as Error).message}`,
          },
        },
      }),
    },
  );

  await sleep(10);

  // Example of instant with callback options (error case)
  try {
    profiler.instant(
      'instant-work-error-with-options',
      () => {
        throw new Error('This instant work always fails');
      },
      {
        onSuccess: result => ({
          detail: {
            devtools: {
              dataType: 'marker',
              color: 'primary',
              properties: [
                ['Result', 'Success'],
                ['Value', result.value?.toFixed(2) || 'unknown'],
              ],
              tooltipText: `Success: ${result.value?.toFixed(2) || 'unknown'}`,
            },
          },
        }),
        onError: error => ({
          detail: {
            devtools: {
              dataType: 'marker',
              color: 'error',
              properties: [
                ['Result', 'Error'],
                ['Error', (error as Error).message],
              ],
              tooltipText: `Error: ${(error as Error).message}`,
            },
          },
        }),
      },
    );
  } catch (e) {
    // Expected error
  }

  await sleep(10);

  // Example of instantSettled - returns PromiseSettledResult synchronously
  const instantSettledResult = profiler.instantSettled(
    'instant-work-success-settled',
    () => {
      const value = Math.random() * 100;
      if (value > 50) {
        return { success: true, value };
      } else {
        throw new Error(`Value ${value.toFixed(2)} is too low`);
      }
    },
  );

  await sleep(10);

  // Example of instantSettled with error
  const instantSettledErrorResult = profiler.instantSettled(
    'instant-work-error-settled',
    () => {
      throw new Error('This instant work always fails');
    },
  );
}

runTest();
