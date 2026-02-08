import {
  DEFAULT_OUT_DIR,
  DEFAULT_TEST_INCLUDES,
  EXTENDS_TSCONFIG_JSON,
  TEST_TYPES,
} from '../baseline/constants';
import { createJsonBaselineTyped } from '../src/lib/baseline/baseline.json';
import { arr, object } from '../src/lib/baseline/baseline.json';
import type { TsConfigJson } from '../src/lib/baseline/tsconfig.type';

/**
 * Baseline for e2e test configurations (tsconfig.e2e.json).
 *
 * Standardizes:
 * - E2E test files (tests directory)
 * - Vitest globals and types
 * - Includes vitest config, tests directory, mocks, and repo vitest setup
 * - Uses test types for e2e test code
 * - Does not override target (no ES2020 target)
 */
const tsconfigE2EBase = createJsonBaselineTyped<TsConfigJson>({
  matcher: ['tsconfig.e2e.json'],
  fileName: 'tsconfig.e2e.json',
  baseline: root =>
    root.set({
      extends: EXTENDS_TSCONFIG_JSON,
      compilerOptions: object(c =>
        c.set({
          outDir: DEFAULT_OUT_DIR,
          types: [...TEST_TYPES],
          // Explicitly do not set target - e2e tests should inherit from base config
        }),
      ),
      include: arr(a => a.add(...DEFAULT_TEST_INCLUDES)),
    }),
});

export default tsconfigE2EBase;
