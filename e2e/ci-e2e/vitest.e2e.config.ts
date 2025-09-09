/// <reference types="vitest" />
import { createE2eConfig } from '../../testing/test-setup/src/lib/config/vitest-setup-presets.js';

export default createE2eConfig(
  'ci-e2e',
  {
    projectRoot: new URL('../../', import.meta.url),
    cacheKey: 'ci-e2e',
  },
  {
    test: {
      testTimeout: 60_000,
      globalSetup: ['./global-setup.ts'],
      coverage: { enabled: false },
    },
  },
);
