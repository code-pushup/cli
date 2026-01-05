import { performance } from 'node:perf_hooks';
import { getProfiler } from './profiler.js';
import {
  asOptions,
  errorToEntryMeta,
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

// Re-export for use in other modules
export type { TrackMeta, TrackStyle };

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
  getNames: (baseName: string) => {
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

export interface TrackControl<
  Tracks extends Record<string, TrackStyle & TrackMeta> = Record<
    string,
    TrackStyle & TrackMeta
  >,
> {
  tracks: Tracks & { defaultTrack: TrackStyle & TrackMeta };
  errorHandler: (error: unknown) => EntryMeta;
}

export type TrackControlOptions<
  Tracks extends Record<string, TrackStyle & TrackMeta> = Record<
    string,
    TrackStyle & TrackMeta
  >,
> = {
  defaultTrack?: Partial<TrackMeta> & TrackStyle;
  tracks?: Tracks;
  errorHandler?: (error: unknown) => EntryMeta;
};

export function getTrackControl<
  Tracks extends Record<string, TrackStyle & TrackMeta> = Record<
    string,
    TrackStyle & TrackMeta
  >,
>(options: TrackControlOptions<Tracks> = {}): TrackControl<Tracks> {
  const { defaultTrack, tracks = {} as Tracks, errorHandler } = options;
  return {
    tracks: {
      defaultTrack: {
        track: 'Main',
        ...defaultTrack,
      },
      ...tracks,
    },
    errorHandler: errorHandler ?? errorToEntryMeta,
  };
}

export type DevToolsOptionCb<Track extends string = string, R = unknown> = Omit<
  TrackMeta,
  'track'
> &
  TrackStyle & {
    track: Track | string; // Can be track key or track value
    success?: (result: R) => EntryMeta;
    error?: (err: unknown) => EntryMeta;
  };

export interface PerformanceAPIExtension<Track extends string> {
  marker(name: string, options: MarkerPayload & { track: Track }): void;

  mark(name: string, options?: TrackEntryPayload & { track: Track }): void;

  measure<T>(
    name: string,
    fn: () => T,
    options?: DevToolsOptionCb<Track, T> | Track | (TrackStyle & TrackMeta),
  ): T;

  measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    options?: DevToolsOptionCb<Track, T> | Track | (TrackStyle & TrackMeta),
  ): Promise<T>;
}

export function span<T>(
  name: string,
  fn: () => T,
  options: DevToolsOptionCb<string, T>,
): T {
  const { startName, measureName, endName } = getMeasureMarkNames(name);
  const { error, success, ...spanDetails } = options ?? {};
  performance.mark(name, asOptions(trackEntryPayload(spanDetails)));
  try {
    const result = fn();
    performance.measure(measureName, {
      start: startName,
      end: endName,
      ...asOptions(
        trackEntryPayload({
          ...spanDetails,
        }),
      ),
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
  options: DevToolsOptionCb<string, T>,
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
