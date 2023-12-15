import { PersistConfig, persistConfigSchema } from '../../src';

export function persistConfig(
  opt?: Partial<PersistConfig>,
): Required<PersistConfig> {
  return persistConfigSchema.parse({
    outputDir: 'tmp',
    filename: 'report',
    format: ['json'],
    ...opt,
  }) as Required<PersistConfig>;
}
