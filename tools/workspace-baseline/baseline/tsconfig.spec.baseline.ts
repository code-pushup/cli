import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { arr, obj } from '../src/lib/baseline.tsconfig';
import {
  DEFAULT_OUT_DIR,
  EXTENDS_TSCONFIG_JSON,
  SPEC_INCLUDES,
  SPEC_TYPES,
} from './constants';

/**
 * Baseline for spec configurations (tsconfig.spec.json).
 *
 * Standardizes:
 * - Alternative naming for test configs (e.g., eslint-formatter-multi)
 * - Includes mocks pattern (standardized naming: mocks folder)
 * - Includes vite config files and spec/test files
 */
export const tsconfigSpecBase = createTsconfigBase('tsconfig.spec.json', {
  extends: EXTENDS_TSCONFIG_JSON,
  compilerOptions: obj.add({
    outDir: DEFAULT_OUT_DIR,
    types: SPEC_TYPES,
  }),
  include: arr.add(...SPEC_INCLUDES),
});
