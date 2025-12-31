import type { PerformanceMark, PerformanceMeasure } from 'node:perf_hooks';
import {
  createTrackEntry,
  createTrackEntryFromError,
  errorToDevToolsProperties,
} from './user-timing-details-utils.js';
import type {
  DevToolsTrackEntry,
  UserTimingDetail,
} from './user-timing-details.type';

export const MARK_SUFFIX = {
  START: ':start',
  END: ':end',
} as const;

export function getStartMarkName(baseName: string, prefix?: string) {
  const prfx = prefix ? `${prefix}:` : '';
  return `${prfx}${baseName}${MARK_SUFFIX.START}`;
}

export function getEndMarkName(baseName: string, prefix?: string) {
  const prfx = prefix ? `${prefix}:` : '';
  return `${prfx}${baseName}${MARK_SUFFIX.END}`;
}

export function getMeasureMarkNames(baseName: string, prefix?: string) {
  const prfx = prefix ? `${prefix}:` : '';
  return {
    startName: getStartMarkName(baseName, prefix),
    endName: getEndMarkName(baseName, prefix),
    measureName: `${prfx}${baseName}`,
  };
}

export interface ProfilerMethods {
  mark(markName: string, markOptions?: PerformanceMarkOptions): PerformanceMark;

  measure(measureName: string): PerformanceMeasure;
  measure(measureName: string, startMark: string): PerformanceMeasure;
  measure(
    measureName: string,
    startMark: string,
    endMark: string,
  ): PerformanceMeasure;
  measure(
    measureName: string,
    options: PerformanceMeasureOptions,
  ): PerformanceMeasure;
}

export type DetailsOptionCb<T> = {
  base?: () => Partial<DevToolsTrackEntry> & { track: string };
  error: (err: unknown) => Partial<UserTimingDetail>;
  success: (result: T) => Partial<UserTimingDetail>;
};

export function timerifySync<T>(
  profiler: ProfilerMethods | Pick<Performance, 'mark' | 'measure'>,
  name: string,
  fn: () => T,
  options?: DetailsOptionCb<T>,
): T {
  const { startName, measureName, endName } = getMeasureMarkNames(name);
  const { error, success } = options ?? {};
  profiler.mark(startName);
  try {
    const result = fn();
    profiler.mark(endName);
    profiler.measure(measureName, {
      start: startName,
      end: endName,
      detail: success?.(result),
    });
    return result;
  } catch (err) {
    profiler.mark(endName);
    profiler.measure(measureName, {
      start: startName,
      end: endName,
      detail: {
        ...errorToDevToolsProperties(err),
        ...error?.(err),
      },
    });
    throw err;
  }
}

export const MAIN_TRACK_NAME = 'Program';

export function mainTrack(): { track: string } {
  return {
    track: MAIN_TRACK_NAME,
  };
}
export type DevToolsOptionCb<T> = {
  base?: () => Partial<DevToolsTrackEntry> & { track: string };
  success: (result: T) => Partial<DevToolsTrackEntry>;
  error: (err: unknown) => Partial<DevToolsTrackEntry>;
};

export function measureSync<T>(
  profiler: ProfilerMethods | Pick<Performance, 'mark' | 'measure'>,
  name: string,
  fn: () => T,
  options?: DevToolsOptionCb<T>,
): T {
  const { startName, measureName, endName } = getMeasureMarkNames(name);
  const { error, success, base } = options ?? {};
  const devtools = {
    ...mainTrack(),
    ...base?.(),
  };
  const detailBase = {
    detail: {
      devtools,
    },
  };
  profiler.mark(startName, detailBase);
  try {
    const result = fn();
    profiler.mark(endName, detailBase);
    profiler.measure(measureName, {
      start: startName,
      end: endName,
      detail: {
        devtools: createTrackEntry({
          ...devtools,
          ...success?.(result),
        }),
      },
    });
    return result;
  } catch (err) {
    profiler.mark(endName, detailBase);
    profiler.measure(measureName, {
      start: startName,
      end: endName,
      detail: {
        devtools: createTrackEntryFromError(err, {
          ...devtools,
          ...error?.(err),
        }),
      },
    });
    throw err;
  }
}

export async function measureAsync<T, O>(
  profiler: ProfilerMethods | Pick<Performance, 'mark' | 'measure'>,
  name: string,
  fn: () => Promise<T>,
  options?: DevToolsOptionCb<T>,
): Promise<T> {
  const { startName, measureName, endName } = getMeasureMarkNames(name);
  const { base, error, success } = options ?? {};
  const devtools = {
    ...mainTrack(),
    ...base?.(),
  };
  const detailBase = {
    detail: {
      devtools,
    },
  };
  profiler.mark(startName, detailBase);
  try {
    const result = await fn();
    profiler.mark(endName, detailBase);
    profiler.measure(measureName, {
      start: startName,
      end: endName,
      detail: {
        devtools: createTrackEntry({
          ...devtools,
          ...success?.(result),
        }),
      },
    });
    return result;
  } catch (err) {
    profiler.mark(endName, detailBase);
    profiler.measure(measureName, {
      start: startName,
      end: endName,
      detail: {
        devtools: createTrackEntryFromError(err, {
          ...devtools,
          ...error?.(err),
        }),
      },
    });
    throw err;
  }
}
