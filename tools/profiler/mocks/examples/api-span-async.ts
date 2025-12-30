import { setTimeout as sleep } from 'node:timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'api-span-async',
    spans: {
      main: {
        track: 'Main Track',
        group: 'Main Group',
        color: 'primary-dark',
      },
    } as const,
  });
  const work = async () => {
    const iterations = 10;
    const keys = Array(iterations).keys();
    for (const i of keys) {
      Math.sqrt(i);
      await sleep(10);
    }
    return { iterations };
  };

  const workError = async () => {
    const res = await work();
    throw new Error(`Iteration ${res.iterations} failed!`);
  };

  await profiler.spanAsync('doWorkSync', work);

  await sleep(10);

  const workResult = profiler.spanAsync('doWorkSyncWithOptions', work, {
    onSuccess: result => ({
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Work',
          trackGroup: 'Success',
          color: 'primary',
          properties: [
            ['Iterations', result.iterations],
            ['Status', 'Success'],
          ],
          tooltipText: `Completed ${result.iterations} iterations successfully`,
        },
      },
    }),
    onError: error => ({
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Work',
          trackGroup: 'Error',
          color: 'error',
          properties: [
            ['Error', (error as Error).message],
            ['Status', 'Failed'],
          ],
          tooltipText: `Work failed: ${(error as Error).message}`,
        },
      },
    }),
  });

  await sleep(10);

  const spanResult = await profiler.spanAsync('doWorkSyncSettled', work);

  await sleep(10);

  try {
    await profiler.spanAsync('doWorkSyncThatThrows', async () => {
      const res = await work();
      throw new Error(`Iteration ${res.iterations} failed!`);
    });
  } catch (e) {
    // Expected error
  }

  await sleep(10);

  try {
    profiler.spanAsync('doWorkSyncThatThrowsWithOptions', workError, {
      onSuccess: result => ({
        detail: {
          devtools: {
            dataType: 'track-entry',
            track: 'Work',
            trackGroup: 'Success',
            color: 'primary',
            properties: [
              ['Iterations', result.iterations],
              ['Status', 'Success'],
            ],
            tooltipText: `Completed ${result.iterations} iterations successfully`,
          },
        },
      }),
      onError: error => ({
        detail: {
          devtools: {
            dataType: 'track-entry',
            track: 'Work',
            trackGroup: 'Error',
            color: 'error',
            properties: [
              ['Error', (error as Error).message],
              ['Status', 'Failed'],
            ],
            tooltipText: `Work failed: ${(error as Error).message}`,
          },
        },
      }),
    });
  } catch (e) {
    // Expected error
  }

  await sleep(10);

  await profiler.spanAsync('doWorkSyncThatThrowsSettled', workError);
}

runTest();
