import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { arr, obj } from '../src/lib/baseline.tsconfig';
import {
  DEFAULT_TEST_INCLUDES,
  EXTENDS_TSCONFIG_JSON,
  NODE_TYPES,
  ROOT_OUT_DIR,
  TEST_TYPES,
} from './constants';

/**
 * Baseline for E2E test configurations (tsconfig.test.json in e2e projects).
 *
 * Standardizes:
 * - Uses existing base target (no ES2020 override)
 * - Includes mocks pattern (standardized naming: mocks folder)
 * - Includes e2e-specific test files
 */
export const tsconfigE2EBase = createTsconfigBase('tsconfig.test.json', {
  renameFrom: 'tsconfig.spec.json', // Match and rename from spec to test
  tags: ['type:e2e'],
  extends: EXTENDS_TSCONFIG_JSON,
  compilerOptions: obj.add({
    outDir: ROOT_OUT_DIR,
    types: TEST_TYPES,
  }),
  include: arr.add(...DEFAULT_TEST_INCLUDES),
});
