import { PersistConfig } from '../../src';

export function persistConfig(opt?: Partial<PersistConfig>): PersistConfig {
  return {
    outputDir: 'tmp',
    ...opt,
  };
}
