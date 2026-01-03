import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '@code-pushup/profiler';
import {
  type DevToolsOptionCb,
  span,
  spanAsync,
} from '../../src/lib/performance-utils';
import { markerPayload } from '../../src/lib/user-timing-details-utils';
import type {
  TrackEntryPayload,
  UserTimingDetail,
} from '../../src/lib/user-timing-details.type';

function doWork(): number {
  for (let i = 0; i < 1e6; i++) {
    Math.sqrt(i);
  }
  return 1e6;
}

function doWorkThrow(): number {
  const res = doWork();
  throw new Error(`Iteration ${res} failed sync.`);
}

async function doWorkAsync(): Promise<number> {
  const res = doWork();
  await sleep(5);
  return res;
}

async function doWorkAsyncThrow(): Promise<number> {
  const res = await doWorkAsync();
  throw new Error(`Iteration ${res} failed ssync.`);
}

async function run() {
  // ======= TIMERIFY =======
  await sleep(20);

  performance.mark('matk:start', {
    detail: {
      devtools: markerPayload(),
    },
  });

  // === start mark ===

  const profiler = getProfiler({
    fileBaseName: 'utils-profiling',
    enabled: true,
    captureBuffered: true,
  });

  // ======= MEASURE =======

  const optionCallbacks: DevToolsOptionCb<ReturnType<typeof doWork>> = {
    success: (result: number) => ({
      properties: [['Iterations', String(result)]],
      tooltipText: `Completed ${result} iterations successfully`,
    }),
    error: (err: unknown) => ({
      properties: [['Stack', String((err as Error).stack)]],
      tooltipText: `Work failed caused by: ${(err as Error).name}`,
    }),
  };

  span('performance-measureSync1-success', doWork, optionCallbacks);
  try {
    span('performance-measureSync1-error', doWorkThrow, optionCallbacks);
  } catch {
    /* swallow to keep the program running */
  }

  span(profiler, 'profiler-measureSync1-success', doWork, optionCallbacks);
  try {
    span(profiler, 'profiler-measureSync1-error', doWorkThrow, optionCallbacks);
  } catch {
    /* swallow to keep the program running */
  }

  await spanAsync(
    performance,
    'performance-measureAsync1-success',
    doWorkAsync,
    optionCallbacks,
  );
  try {
    await spanAsync(
      performance,
      'performance-measureAsync1-error',
      doWorkAsyncThrow,
      optionCallbacks,
    );
  } catch {
    /* swallow to keep the program running */
  }

  await spanAsync(
    profiler,
    'profiler-measureAsync2-success',
    doWorkAsync,
    optionCallbacks,
  );
  try {
    await spanAsync(
      profiler,
      'profiler-measureAsync2-error',
      doWorkAsyncThrow,
      optionCallbacks,
    );
  } catch (err) {}
}

await run();
