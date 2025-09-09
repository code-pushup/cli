/// <reference types="vitest" />
import {
  createUnitConfig,
  setupPresets,
} from './src/lib/vitest-setup-presets.js';

export default createUnitConfig(
  'test-setup-config',
  {
    projectRoot: new URL('../../', import.meta.url),
  },
  {
    test: {
      include: ['src/**/*.{unit,type}.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: [...setupPresets.unit.base, ...setupPresets.unit.matcherPath],
      coverage: {
        enabled: true,
        reporter: ['text', 'lcov'],
        exclude: ['**/*.mock.{mjs,ts}', '**/*.config.{js,mjs,ts}'],
      },
    },
  },
);
