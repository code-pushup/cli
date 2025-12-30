import process from 'node:process';
import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  // Create marks for measurement
  performance.mark('buffered-mark-start');
  await sleep(100);
  performance.mark('buffered-mark-end');
  await sleep(100);
  // Test measure with string overloads
  const measure1 = performance.measure(
    'buffered-measure-1',
    'buffered-mark-start',
    'buffered-mark-end',
  );
  await sleep(100);
  const measure2 = performance.measure(
    'buffered-measure-2',
    'buffered-mark-start',
  );
  await sleep(100);
  // File upload measurement
  const measure3 = performance.measure(
    'buffered-measure-file-upload-complete',
    {
      start: 'buffered-mark-start',
      end: 'buffered-mark-end',
    },
  );
  await sleep(100);

  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'buffered-performance-test',
  });

  await sleep(100);

  await profiler.spanAsync('span-async-measure', async () => {
    await sleep(100);
  });
}

await runTest();
