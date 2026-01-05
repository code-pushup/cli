import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '@code-pushup/profiler';
import { span, spanAsync } from '../../src/lib/performance-utils';
import {
  asOptions,
  markerPayload,
} from '../../src/lib/user-timing-details-utils';
import { asyncWork, work } from '../test-utils';

async function run() {
  // ======= TIMERIFY =======
  await sleep(20);

  performance.mark('matk:start', asOptions(markerPayload()));

  // === start mark ===

  const profiler = getProfiler({
    fileBaseName: 'utils-profiling',
    enabled: true,
    captureBuffered: true,
  });

  // ======= MEASURE =======

  const optionCallbacks: {
    track?: string;
    success?: (result: ReturnType<typeof work>) => {
      properties?: [string, string][];
      tooltipText?: string;
    };
    error?: (err: unknown) => {
      properties?: [string, string][];
      tooltipText?: string;
    };
  } = {
    track: 'performance-utils',
    success: (result: number) => ({
      properties: [['Iterations', String(result)]],
      tooltipText: `Completed ${result} iterations successfully`,
    }),
    error: (err: unknown) => ({
      properties: [['Stack', String((err as Error).stack)]],
      tooltipText: `Work failed caused by: ${(err as Error).name}`,
    }),
  };

  span('performance-measureSync1-success', work, optionCallbacks);
  try {
    span('performance-measureSync1-error', () => work(true), optionCallbacks);
  } catch {
    /* swallow to keep the program running */
  }

  profiler.measure('profiler-measureSync1-success', work, optionCallbacks);
  try {
    profiler.measure(
      'profiler-measureSync1-error',
      () => work(true),
      optionCallbacks,
    );
  } catch {
    /* swallow to keep the program running */
  }

  await spanAsync(
    'performance-measureAsync1-success',
    asyncWork,
    optionCallbacks,
  );
  try {
    await spanAsync(
      'performance-measureAsync1-error',
      () => asyncWork(true),
      optionCallbacks,
    );
  } catch {
    /* swallow to keep the program running */
  }

  await profiler.measureAsync(
    'profiler-measureAsync2-success',
    asyncWork,
    optionCallbacks,
  );
  try {
    await profiler.measureAsync(
      'profiler-measureAsync2-error',
      () => asyncWork(true),
      optionCallbacks,
    );
  } catch (err) {}
}

await run();
