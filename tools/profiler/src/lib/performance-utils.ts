import { errorToEntryMeta } from './user-timing-details-utils.js';
import {
  type EntryMeta,
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
  getNames: (baseName: string) => {
    startName: string;
    endName: string;
    measureName: string;
  };
}

export function getMeasureControl(defaultPrefix?: string): MeasureControl {
  return {
    getNames: name => getMeasureMarkNames(name, defaultPrefix),
  };
}

export interface TrackControl<
  Tracks extends Record<string, TrackStyle & TrackMeta> = Record<
    string,
    TrackStyle & TrackMeta
  >,
> {
  tracks: Tracks & {
    defaultTrack: TrackStyle & TrackMeta;
    externalTrack: TrackStyle & TrackMeta;
  };
  errorHandler: (error: unknown) => EntryMeta;
}

export type TrackControlOptions<
  Tracks extends Record<string, TrackStyle & TrackMeta> = Record<
    string,
    TrackStyle & TrackMeta
  >,
> = {
  defaultTrack?: Partial<TrackMeta> & TrackStyle;
  externalTrack?: Partial<TrackMeta> & TrackStyle;
  tracks?: Tracks;
  errorHandler?: (error: unknown) => EntryMeta;
};

export function getTrackControl<
  Tracks extends Record<string, TrackStyle & TrackMeta> = Record<
    string,
    TrackStyle & TrackMeta
  >,
>(options: TrackControlOptions<Tracks> = {}): TrackControl<Tracks> {
  const {
    defaultTrack,
    externalTrack,
    tracks = {} as Tracks,
    errorHandler,
  } = options;
  return {
    tracks: {
      defaultTrack: {
        track: 'Main',
        ...defaultTrack,
      },
      externalTrack: {
        track: 'External',
        ...externalTrack,
      },
      ...tracks,
    },
    errorHandler: errorHandler ?? errorToEntryMeta,
  };
}
