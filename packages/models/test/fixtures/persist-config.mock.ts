import {PERSIST_FILENAME, PERSIST_FORMAT, PERSIST_OUTPUT_DIR, PersistConfig, persistConfigSchema} from '../../src';

export function persistConfig(
  opt?: Partial<PersistConfig>,
): Required<PersistConfig> {
  return persistConfigSchema.parse({
    outputDir: PERSIST_OUTPUT_DIR,
    filename: PERSIST_FILENAME,
    format: PERSIST_FORMAT,
    ...opt,
  }) as Required<PersistConfig>;
}
