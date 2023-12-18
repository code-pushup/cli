import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  PersistConfig,
} from '@code-pushup/models';

export const normalizePersistConfig = (
  cfg?: Partial<PersistConfig>,
): Required<PersistConfig> => ({
  outputDir: PERSIST_OUTPUT_DIR,
  filename: PERSIST_FILENAME,
  format: PERSIST_FORMAT,
  ...cfg,
});
