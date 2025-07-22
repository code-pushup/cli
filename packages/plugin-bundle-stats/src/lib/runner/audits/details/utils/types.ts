export type ArtefactType = 'root' | 'entry-file' | 'static-import' | 'group';

export type StatsNodeValues = {
  path: string;
  bytes: number;
  sources: number;
  type: ArtefactType;
  icon?: string;
};
