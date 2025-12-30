import { setTimeout as sleep } from 'node:timers/promises';
import { getProfiler } from '../../src/index.js';

async function runTest() {
  const profiler = getProfiler({
    enabled: true,
    fileBaseName: 'api-span',
    spans: {
      main: {
        track: 'Main Track',
        group: 'Main Group',
        color: 'primary-dark',
      },
    } as const,
  });
  const work = () => {
    const iterations = 1e6;
    const keys = Array(iterations).keys();
    for (const i of keys) {
      Math.sqrt(i);
    }
    return { iterations };
  };

  profiler.span('doWorkSync', work);

  await sleep(10);

  try {
    profiler.span('doWorkSyncThatThrows', () => {
      const res = work();
      throw new Error(`Iteration ${res.iterations} failed!`);
    });
  } catch (e) {
    // Expected error
  }

  await sleep(10);

  try {
    profiler.span(
      'doWorkSyncThatThrowsWithOptions',
      () => {
        const res = work();
        throw new Error(`Iteration ${res.iterations} failed!`);
      },
      {
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
      },
    );
  } catch (e) {
    // swallow to see error in trace and still keep processing more
  }

  await sleep(10);

  profiler.span('doWorkSyncThatThrowsSettled', () => {
    const res = work();
    throw new Error(`Iteration ${res.iterations} failed!`);
  });
}

runTest();
