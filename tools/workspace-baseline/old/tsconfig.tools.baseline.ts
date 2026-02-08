import {
  EXTENDS_TSCONFIG_JSON,
  NODENEXT_TYPES,
  TOOLS_CONFIG_FILES,
} from '../baseline/constants';
import type { TsConfigJson } from '../baseline/tsconfig';
import {
  arr,
  createJsonBaselineTyped,
  object,
} from '../src/lib/baseline/baseline.json';

/**
 * Baseline for tools configurations (tsconfig.tools.json).
 *
 * Standardizes:
 * - Tools-specific configs (e.g., zod2md)
 * - Uses nodenext types for tool scripts
 * - Renames tsconfig.perf.json files to tsconfig.tools.json
 */
const tsconfigToolsBase = createJsonBaselineTyped<TsConfigJson>({
  matcher: ['tsconfig.(tools|perf).json'],
  fileName: 'tsconfig.tools.json',
  baseline: root =>
    root.set({
      exclude: arr(a => a.add(...TOOLS_CONFIG_FILES)),
      extends: EXTENDS_TSCONFIG_JSON,
      compilerOptions: object(c =>
        c.set({
          baseUrl: '.',
          rootDir: '.',
          types: NODENEXT_TYPES,
        }),
      ),
      include: arr(a => a.add(...TOOLS_CONFIG_FILES)),
    }),
});

export default tsconfigToolsBase;
