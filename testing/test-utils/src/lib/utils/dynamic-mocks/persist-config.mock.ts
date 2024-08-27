import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  type PersistConfig,
  persistConfigSchema,
} from '@code-pushup/models';

export function persistConfigMock(
  opt?: Partial<PersistConfig>,
): Required<PersistConfig> {
  return persistConfigSchema.parse({
    outputDir: DEFAULT_PERSIST_OUTPUT_DIR,
    filename: DEFAULT_PERSIST_FILENAME,
    format: DEFAULT_PERSIST_FORMAT,
    ...opt,
  }) as Required<PersistConfig>;
}
