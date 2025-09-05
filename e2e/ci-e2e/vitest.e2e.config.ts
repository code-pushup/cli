/// <reference types="vitest" />
import { createE2eConfig } from '../../tools/vitest-config-factory.js';

export default createE2eConfig('ci-e2e', {
  projectRoot: new URL('../../', import.meta.url),
  testTimeout: 60_000,
  globalSetup: ['./global-setup.ts'],
  coverage: { enabled: false },
  cacheKey: 'ci-e2e',
});
