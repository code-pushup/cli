/// <reference types="vitest" />
import {
  createUnitConfig,
  setupPresets,
} from '../../testing/test-setup/src/lib/config/vitest-setup-presets.js';

export default createUnitConfig(
  'core',
  {
    projectRoot: new URL('../../', import.meta.url),
  },
  {
    test: {
      setupFiles: [
        ...setupPresets.unit.base,
        ...setupPresets.unit.git,
        ...setupPresets.unit.portalClient,
        ...setupPresets.unit.matchersCore,
      ],
    },
  },
);
