import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'api-marker',
  });

  // Basic instant.mark
  profiler.marker('instant');
  await sleep(10);

  // Instant.marker with devtools error track entry
  profiler.marker('instant-details-devtools-error', {
    color: 'error',
    properties: [
      ['Error Type', 'ValidationError'],
      ['Error Message', 'Invalid input data provided'],
    ],
    tooltipText: 'ValidationError: Invalid input data provided',
  });

  await sleep(10);
}

runTest();
