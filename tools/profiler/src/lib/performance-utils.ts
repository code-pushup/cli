import { performance } from 'node:perf_hooks';
import {
  asOptions,
  errorToTrackEntryPayload,
  trackEntryPayload,
} from './user-timing-details-utils.js';
import {
  type DevToolsActionColor,
  type EntryMeta,
  type MarkerPayload,
  type TrackEntryPayload,
  type TrackMeta,
  type TrackStyle,
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

export interface MeasureControl {
  defaultPrefix?: string;
  getNames: (
    baseName: string,
    prefix?: string,
  ) => {
    startName: string;
    endName: string;
    measureName: string;
  };
}

export function getMeasureControl(defaultPrefix?: string): MeasureControl {
  return {
    defaultPrefix,
    getNames: getMeasureMarkNames,
  };
}

export interface TrackControl {
  defaultTrack: TrackMeta & TrackStyle;
  errorHandler?: (error: unknown) => EntryMeta;
}

export type TrackControlOptions = {
  defaultTrack?: Partial<TrackMeta> & TrackStyle;
  errorHandler?: (error: unknown) => EntryMeta;
};

export function getTrackControl(options?: TrackControlOptions): TrackControl {
  const { defaultTrack, errorHandler } = options ?? {};
  return {
    defaultTrack: {
      track: 'Main',
      ...defaultTrack,
    },
    errorHandler,
  };
}

export type DevToolsOptionCb<T> = TrackMeta &
  TrackStyle & {
    success?: (result: T) => EntryMeta;
    error?: (err: unknown) => EntryMeta;
  };

export interface PerformanceAPIExtension {
  instantMarker(name: string, options: MarkerPayload): void;

  instantTrackEntry(name: string, options?: TrackEntryPayload): void;

  span<T>(name: string, fn: () => T, options?: DevToolsOptionCb<T>): T;

  spanAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?: DevToolsOptionCb<T>,
  ): Promise<T>;
}

export function span<T>(
  name: string,
  fn: () => T,
  options: DevToolsOptionCb<T>,
): T {
  const { startName, measureName, endName } = getMeasureMarkNames(name);
  const { error, success, ...spanDetails } = options ?? {};
  performance.mark(startName, asOptions(trackEntryPayload(spanDetails)));
  try {
    const result = fn();
    performance.measure(measureName, {
      start: startName,
      end: endName,
      ...asOptions(trackEntryPayload(spanDetails)),
    });
    return result;
  } catch (err) {
    const errorOptions = asOptions(
      errorToTrackEntryPayload(err, {
        ...spanDetails,
        ...error?.(err),
      }),
    );
    performance.mark(endName, errorOptions);
    performance.measure(measureName, {
      start: startName,
      end: endName,
      ...errorOptions,
    });
    throw err;
  }
}

export async function spanAsync<T>(
  name: string,
  fn: () => Promise<T>,
  options: DevToolsOptionCb<T>,
): Promise<T> {
  const { startName, measureName, endName } = getMeasureMarkNames(name);
  const { error, success, ...spanDetail } = options ?? {};
  performance.mark(startName, asOptions(trackEntryPayload(spanDetail)));
  try {
    const result = await fn();
    performance.mark(endName, asOptions(trackEntryPayload(spanDetail)));
    performance.measure(measureName, {
      start: startName,
      end: endName,
      ...asOptions(
        trackEntryPayload({
          ...spanDetail,
          ...success?.(result),
        }),
      ),
    });
    return result;
  } catch (err) {
    const errorOptions = asOptions(
      errorToTrackEntryPayload(err, {
        ...spanDetail,
        ...error?.(err),
      }),
    );
    performance.mark(endName, errorOptions);
    performance.measure(measureName, {
      start: startName,
      end: endName,
      ...errorOptions,
    });
    throw err;
  }
}
