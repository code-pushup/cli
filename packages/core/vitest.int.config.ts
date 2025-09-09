/// <reference types="vitest" />
import {
  createIntConfig,
  setupPresets,
} from '../../testing/test-setup/src/lib/config/vitest-setup-presets.js';

export default createIntConfig(
  'core',
  {
    projectRoot: new URL('../../', import.meta.url),
  },
  {
    test: {
      setupFiles: [...setupPresets.int.base, ...setupPresets.int.portalClient],
    },
  },
);
