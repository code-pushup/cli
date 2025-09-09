/// <reference types="vitest" />
import { createE2eConfig } from '../../testing/test-setup-config/src/lib/vitest-setup-presets.js';

export default createE2eConfig(
  'plugin-typescript-e2e',
  {
    projectRoot: new URL('../../', import.meta.url),
    cacheKey: 'plugin-typescript-e2e',
  },
  {
    test: {
      testTimeout: 20_000,
      coverage: { enabled: true },
    },
  },
);
