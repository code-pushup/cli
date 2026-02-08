import {
  DEFAULT_OUT_DIR,
  EXTENDS_TSCONFIG_JSON,
  LIB_EXCLUDES,
  LIB_INCLUDES,
  NODE_TYPES,
} from '../baseline/constants';
import type { TsConfigJson } from '../baseline/tsconfig';
import {
  arr,
  createJsonBaselineTyped,
  object,
} from '../src/lib/baseline/baseline.json';

/**
 * Baseline for library configurations (tsconfig.lib.json).
 *
 * Standardizes:
 * - Library source files (src directory)
 * - Declaration files enabled for library builds
 * - Excludes test files, mock files, and vitest configs
 * - Uses node types for library code
 */
const tsconfigLibBase = createJsonBaselineTyped<TsConfigJson>({
  matcher: ['tsconfig.lib.json'],
  fileName: 'tsconfig.lib.json',
  baseline: root =>
    root.set({
      exclude: arr(a => a.add(...LIB_EXCLUDES)),
      extends: EXTENDS_TSCONFIG_JSON,
      compilerOptions: object(c =>
        c.set({
          outDir: DEFAULT_OUT_DIR,
          declaration: true,
          types: NODE_TYPES,
        }),
      ),
      include: arr(a => a.add(...LIB_INCLUDES)),
    }),
});

export default tsconfigLibBase;
