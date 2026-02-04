import { createTsconfigBaseTyped } from '../src/lib/baseline.tsconfig';
import {
  DEFAULT_OUT_DIR,
  EXTENDS_TSCONFIG_JSON,
  STANDARD_TEST_INCLUDES,
  TEST_TYPES,
} from './constants';

/**
 * Baseline for test configurations (tsconfig.test.json).
 *
 * Standardizes:
 * - Includes mocks pattern (standardized naming: mocks folder)
 * - Includes test files and vitest setup
 * - Uses repo root path resolution: paths prefixed with 'repo:' are resolved relative to repo root
 * - Renames tsconfig.spec.json files to tsconfig.test.json
 */
export const tsconfigTestBase = createTsconfigBaseTyped('tsconfig.test.json', {
  renameFrom: 'tsconfig.spec.json', // Match and rename from spec to test

  config: {
    extends: EXTENDS_TSCONFIG_JSON,

    compilerOptions: {
      outDir: DEFAULT_OUT_DIR,
      types: [...TEST_TYPES],
    },

    include: [...STANDARD_TEST_INCLUDES],
  },
});
