/// <reference types="vitest" />
import {
  createIntConfig,
  setupPresets,
} from '../../testing/test-setup/src/lib/config/vitest-setup-presets.js';

export default createIntConfig(
  'utils',
  {
    projectRoot: new URL('../../', import.meta.url),
  },
  {
    test: {
      coverage: { exclude: ['perf/**'] },
      setupFiles: [...setupPresets.int.base, ...setupPresets.int.cliui],
    },
  },
);
