import {
  DEFAULT_OUT_DIR,
  EXTENDS_TSCONFIG_JSON,
  STANDARD_TEST_INCLUDES,
  TEST_TYPES,
} from '../baseline/constants';
import type { TsConfigJson } from '../baseline/tsconfig';
import {
  arr,
  createJsonBaselineTyped,
  object,
} from '../src/lib/baseline/baseline.json';

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
