import { createJsonBaselineTyped } from '../src/lib/baseline/baseline.json';
import { arr, object } from '../src/lib/baseline/baseline.json';
import type { TsConfigJson } from '../src/lib/baseline/tsconfig.type';
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
 * - Test files (unit and integration tests)
 * - Vitest globals and types
 * - Includes mocks, test files, and declaration files
 * - Uses test types for test code
 */
const tsconfigTestBase = createJsonBaselineTyped<TsConfigJson>({
  matcher: ['tsconfig.test.json'],
  fileName: 'tsconfig.test.json',
  baseline: root =>
    root.set({
      extends: EXTENDS_TSCONFIG_JSON,
      compilerOptions: object(c =>
        c.set({
          outDir: DEFAULT_OUT_DIR,
          types: [...TEST_TYPES],
        }),
      ),
      include: arr(a => a.add(...STANDARD_TEST_INCLUDES)),
    }),
});

export default tsconfigTestBase;
