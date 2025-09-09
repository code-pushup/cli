/// <reference types="vitest" />
import {
  createUnitConfig,
  setupPresets,
} from '../../testing/test-setup-config/src/lib/vitest-setup-presets.js';

export default createUnitConfig(
  'utils',
  {
    projectRoot: new URL('../../', import.meta.url),
  },
  {
    test: {
      include: ['src/**/*.{unit,type}.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      typecheck: { include: ['**/*.type.test.ts'] },
      coverage: { exclude: ['perf/**'] },
      setupFiles: [
        ...setupPresets.unit.base,
        ...setupPresets.unit.matchersCore,
        ...setupPresets.unit.matcherPath,
      ],
    },
  },
);
