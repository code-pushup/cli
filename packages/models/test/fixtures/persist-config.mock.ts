import { PersistConfig, persistConfigSchema } from '../../src';

export function persistConfig(opt?: Partial<PersistConfig>): PersistConfig {
  return persistConfigSchema.parse({
    outputDir: 'tmp',
    ...opt,
  });
}
