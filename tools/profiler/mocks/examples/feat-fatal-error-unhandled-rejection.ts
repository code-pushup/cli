import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'fatal-error-unhandled-rejection',
  });

  await sleep(100);

  throw new Error('Boom!');
}

await runTest();

await runTest();
