export {
  createUnitTestConfig,
  createIntTestConfig,
  createE2ETestConfig,
} from './lib/vitest-setup-presets.js';

export type { E2ETestOptions, TestKind } from './lib/vitest-config-factory.js';

export {
  createVitestConfig,
  type E2ETestOptions as E2ETestOptionsAlias,
} from './lib/vitest-config-factory.js';

export { getSetupFiles } from './lib/vitest-setup-files.js';
