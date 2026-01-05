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

export const defaultTrack = {
  track: 'Main',
} as const;

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
