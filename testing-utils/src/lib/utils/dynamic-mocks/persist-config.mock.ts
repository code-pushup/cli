import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  PersistConfig,
  persistConfigSchema,
} from '@code-pushup/models';

export function persistConfigMock(
  opt?: Partial<PersistConfig>,
): Required<PersistConfig> {
  return persistConfigSchema.parse({
    outputDir: PERSIST_OUTPUT_DIR,
    filename: PERSIST_FILENAME,
    format: PERSIST_FORMAT,
    ...opt,
  }) as Required<PersistConfig>;
}
