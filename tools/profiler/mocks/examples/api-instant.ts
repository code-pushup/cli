import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'api-instant',
  });

  // Basic instant mark
  profiler.instant('instant');
  await sleep(10);

  // Instant mark with details
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

  // Instant mark with devtools error styling
  profiler.instant('instant-details-error', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Program',
        color: 'error',
        properties: [
          ['Error Type', 'ValidationError'],
          ['Error Message', 'Invalid input data provided'],
        ],
        tooltipText: 'ValidationError: Invalid input data provided',
      },
    },
  });

  await sleep(10);

  // Instant mark with devtools track entry
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

  // Instant mark with devtools error track entry
  profiler.instant('instant-details-devtools-error', {
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Program',
        trackGroup: 'Main Process',
        color: 'error',
        properties: [
          ['Error Type', 'ValidationError'],
          ['Error Message', 'Invalid input data provided'],
        ],
        tooltipText: 'ValidationError: Invalid input data provided',
      },
    },
  });

  await sleep(10);
}

runTest();
