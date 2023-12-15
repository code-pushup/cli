import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  PersistConfig,
  UPLOAD_SERVER,
  UploadConfig,
} from '@code-pushup/models';

export type GlobalOptions = {
  //  'Show progress bar in stdout'
  progress: boolean;
  //  Outputs additional information for a run'
  verbose: boolean;
};

export const normalizePersistConfig = (cfg?: Partial<PersistConfig>): Required<PersistConfig> => ({
  outputDir: PERSIST_OUTPUT_DIR,
  filename: PERSIST_FILENAME,
  format: PERSIST_FORMAT,
  ...cfg,
} as unknown as Required<PersistConfig>);

export const normalizeUploadConfig = (cfg?: Partial<UploadConfig>): Required<UploadConfig> => ({
  server: UPLOAD_SERVER,
 ...cfg,
} as unknown as Required<UploadConfig>);
