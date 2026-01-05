import {
  type EntryMeta,
  type TrackMeta,
  type TrackStyle,
} from './user-timing-details.type.js';

export type ProfilerFileOptions = {
  outDir?: string;
  fileName?: string;
  fileBaseName?: string;
  metadata?: Record<string, unknown>;
};

export interface ProfilerControl {
  getFilePathForExt(ext: 'json' | 'jsonl'): string;

  isEnabled(): boolean;

  enableProfiling(isEnabled: boolean): void;

  close(): void; // writes jsonl -> json
  flush(): void; // writes jsonl
}
export type ProfilerEntryOptions = {
  namePrefix?: string;
  tracks?: {
    defaultTrack?: Partial<TrackMeta> & TrackStyle;
    errorHandler?: (error: unknown) => EntryMeta;
  };
};
