import { setTimeout as sleep } from 'timers/promises';
import {
  type DevToolsOptionCb,
  measureAsync,
  measureSync,
  timerifySync,
} from 'tools/profiler/src/lib/profiler-utils';
import { getProfiler } from '@code-pushup/profiler';
import type {
  DevToolsTrackEntry,
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
  try {
    timerifySync(
      performance,
      'performance-timerifySync-error',
      doWorkThrow,
      detailCallbacks,
    );
  } catch {
    /* swallow to keep the program running */
  }

  // === start mark ===
  const profiler = getProfiler({
    fileBaseName: 'feat-profiler-marker',
    enabled: true,
    captureBuffered: true,
  });

  // ======= MEASURE =======

  const optionCallbacks: DevToolsOptionCb<ReturnType<typeof doWork>> = {
    base: () => ({
      track: 'Work',
    }),
    success: (result: number): Partial<DevToolsTrackEntry> => ({
      properties: [['Iterations', String(result)]],
      tooltipText: `Completed ${result} iterations successfully`,
    }),
    error: (err: unknown): Partial<DevToolsTrackEntry> => ({
      properties: [['Stack', String((err as Error).stack)]],
      tooltipText: `Work failed caused by: ${(err as Error).name}`,
    }),
  };

  measureSync(
    performance,
    'performance-measureSync1-success',
    doWork,
    optionCallbacks,
  );
  try {
    measureSync(
      performance,
      'performance-measureSync1-error',
      doWorkThrow,
      optionCallbacks,
    );
  } catch {
    /* swallow to keep the program running */
  }

  measureSync(
    profiler,
    'profiler-measureSync1-success',
    doWork,
    optionCallbacks,
  );
  try {
    measureSync(
      profiler,
      'profiler-measureSync1-error',
      doWorkThrow,
      optionCallbacks,
    );
  } catch {
    /* swallow to keep the program running */
  }

  await measureAsync(
    performance,
    'performance-measureAsync1-success',
    doWorkAsync,
    optionCallbacks,
  );
  try {
    await measureAsync(
      performance,
      'performance-measureAsync1-error',
      doWorkAsyncThrow,
      optionCallbacks,
    );
  } catch {
    /* swallow to keep the program running */
  }

  await measureAsync(
    profiler,
    'profiler-measureAsync2-success',
    doWorkAsync,
    optionCallbacks,
  );
  try {
    await measureAsync(
      profiler,
      'profiler-measureAsync2-error',
      doWorkAsyncThrow,
      optionCallbacks,
    );
  } catch (err) {}

  profiler.close();
}

await run();
