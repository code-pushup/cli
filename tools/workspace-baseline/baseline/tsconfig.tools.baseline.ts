import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { arr, obj } from '../src/lib/baseline.tsconfig';
import {
  DEFAULT_OUT_DIR,
  EXTENDS_TSCONFIG_JSON,
  NODENEXT_TYPES,
  TOOLS_CONFIG_FILES,
} from './constants';

/**
 * Baseline for tools configurations (tsconfig.tools.json).
 *
 * Standardizes:
 * - Tools-specific configs (e.g., zod2md)
 * - Uses nodenext types for tool scripts
 * - Renames tsconfig.perf.json files to tsconfig.tools.json
 */
export const tsconfigToolsBase = createTsconfigBase('tsconfig.tools.json', {
  renameFrom: 'tsconfig.perf.json', // Match and rename from perf to tools
  extends: EXTENDS_TSCONFIG_JSON,
  compilerOptions: obj.add({
    outDir: DEFAULT_OUT_DIR,
    types: NODENEXT_TYPES,
  }),
  include: arr.add(...TOOLS_CONFIG_FILES),
});
