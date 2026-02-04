import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { arr, obj } from '../src/lib/baseline.tsconfig';
import {
  DEFAULT_OUT_DIR,
  EXTENDS_TSCONFIG_JSON,
  NODE_TYPES,
  PERF_PATTERN,
} from './constants';

/**
 * Baseline for performance test configurations (tsconfig.perf.json).
 *
 * Standardizes:
 * - Minimal config for performance tests
 * - Includes perf files (perf folder)
 */
export const tsconfigPerfBase = createTsconfigBase('tsconfig.perf.json', {
  extends: EXTENDS_TSCONFIG_JSON,
  compilerOptions: obj.add({
    outDir: DEFAULT_OUT_DIR,
    types: NODE_TYPES,
  }),
  include: arr.add(PERF_PATTERN),
});
