import { setTimeout as sleep } from 'timers/promises';
import { getProfiler } from '../../src/index.js';
import { span, spanAsync } from '../../src/lib/performance-utils.js';
import type {
  DevToolsTrackEntry,
  UserTimingDetail,
} from '../../src/lib/user-timing-details.type.js';

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

  // === start mark ===
  const profiler = getProfiler({
    fileBaseName: 'feat-profiler-marker',
    enabled: true,
    captureBuffered: true,
  });

  // ======= MEASURE =======

  const optionCallbacks: {
    base?: () => { track?: string };
    success?: (result: ReturnType<typeof doWork>) => {
      properties?: [string, string][];
      tooltipText?: string;
    };
    error?: (err: unknown) => {
      properties?: [string, string][];
      tooltipText?: string;
    };
  } = {
    base: () => ({
      track: 'Work',
    }),
    success: (result: number) => ({
      properties: [['Iterations', String(result)]],
      tooltipText: `Completed ${result} iterations successfully`,
    }),
    error: (err: unknown) => ({
      properties: [['Stack', String((err as Error).stack)]],
      tooltipText: `Work failed caused by: ${(err as Error).name}`,
    }),
  };

  span(
    performance,
    'performance-measureSync1-success',
    doWork,
    optionCallbacks,
  );
  try {
    span(
      performance,
      'performance-measureSync1-error',
      doWorkThrow,
      optionCallbacks,
    );
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

  profiler.close();
}

await run();
