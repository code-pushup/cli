/// <reference types="vitest" />
import { createE2eConfig } from '../../tools/vitest-config-factory.js';

export default createE2eConfig('plugin-typescript-e2e', {
  projectRoot: new URL('../../', import.meta.url),
  testTimeout: 20_000,
  coverage: { enabled: true, reportsSubdir: 'e2e-tests' },
  cacheKey: 'plugin-typescript-e2e',
});
