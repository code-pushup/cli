import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'api-instant',
  });

  // Basic instant mark
  profiler.instantTrackEntry('instant');
  await sleep(10);

  // Instant mark with devtools error track entry
  profiler.instantTrackEntry('instant-details-devtools-error', {
    track: 'Program',
    trackGroup: 'Main Process',
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
