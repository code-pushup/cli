import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '@code-pushup/profiler';
import {
  type DevToolsOptionCb,
  span,
  spanAsync,
} from '../../src/lib/performance-utils';
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

  const optionCallbacks: DevToolsOptionCb<ReturnType<typeof work>> = {
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

  profiler.span('profiler-measureSync1-success', work, optionCallbacks);
  try {
    profiler.span(
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

  await profiler.spanAsync(
    'profiler-measureAsync2-success',
    asyncWork,
    optionCallbacks,
  );
  try {
    await profiler.spanAsync(
      'profiler-measureAsync2-error',
      () => asyncWork(true),
      optionCallbacks,
    );
  } catch (err) {}
}

await run();
