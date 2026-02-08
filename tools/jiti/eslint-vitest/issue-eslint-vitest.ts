/**
 * Test script for @vitest/eslint-plugin TypeError: Invalid URL issue fix
 * when using tsx loader.
 *
 * This script tests that the fix works by directly loading ESLint configs:
 * - Direct import loads eslint.config.js (mimics loadConfigByPath behavior)
 * - ESLint config imports @code-pushup/eslint-config/vitest.js
 * - That package imports @vitest/eslint-plugin
 * - With the fix: config loads successfully without Invalid URL error
 * - Without the fix: would fail with "new URL('index.cjs', 'about:blank')" error
 *
 * Run with:
 *   TSX_TSCONFIG_PATH=tsconfig.base.json node --import tsx tools/jiti/eslint-vitest/issue-eslint-vitest.ts
 *
 * Flow:
 * -> TSX_TSCONFIG_PATH=tsconfig.base.json node --import tsx node packages/cli/src/index.ts
 *   -> core: loadConfigByPath('code-pushup.config.ts')
 *     -> utils:importModule('code-pushup.config.ts')
 *       -> preset: configureEslintPlugin()
 *         -> nx: eslintConfigFromAllNxProjects()
 *         -> eslint: eslintPlugin(targets)
 *           -> eslint: listAuditsAndGroups(targets)
 *             -> eslint: listRules(targets)
 *               -> eslint: loadRulesForFlatConfig(target)
 *                 -> eslint: loadConfigByPath(eslintrc)
 *                 🔎 🔥 -> loads 'eslint.config.js'
 *                   -> eslint.config.js imports @code-pushup/eslint-config/vitest.js
 *                   -> @code-pushup/eslint-config/vitest.js imports @vitest/eslint-plugin
 *                   -> tsx transforms @vitest/eslint-plugin -> 🔥 Invalid URL error (before fix)
 *                   -> child process prevents tsx interference (after fix)
 *
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Mimic hot path of loading ESLint config  🔎 🔥
const configPath = path.join(process.cwd(), 'code-pushup.config.ts');
const configUrl = pathToFileURL(configPath).toString();
const config = await import(configUrl);

console.log('Reproduction Failed: ESLint config loaded without errors');
console.log(
  'Config type:',
  Array.isArray(config.default)
    ? `array (${config.default.length} items)`
    : typeof config.default,
);
