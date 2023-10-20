import { PersistConfig } from '../../src';

export function persistConfig(outputDir = 'tmp'): PersistConfig {
  return { outputDir };
}
