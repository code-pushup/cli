import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';
import { timerifySync } from '../../src/lib/profiler-utils';
import type { UserTimingDetail } from '../../src/lib/user-timing-details.type';

function doWork(): number {
  for (let i = 0; i < 1e6; i++) {
    Math.sqrt(i);
  }
  return 1e6;
}
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
  const detailCallbacks = {
    success: (result: number): Partial<UserTimingDetail> => ({
      iterations: String(result),
    }),
    error: (err: unknown) => ({
      stack: (err as Error)?.stack?.toString() ?? 'No stack trace available',
    }),
  };

  timerifySync(
    performance,
    'performance-timerifySync-success',
    doWork,
    detailCallbacks,
  );

  // ====== PROFILER START ======

  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'buffered-performance-test',
    captureBuffered: true,
  });

  await sleep(100);

  await profiler.spanAsync('span-async-measure', async () => {
    await sleep(100);
  });
}

await runTest();
