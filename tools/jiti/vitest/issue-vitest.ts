/**
 * Minimal reproduction for @vitest/eslint-plugin TypeError: Invalid URL issue
 * when using tsx loader.
 *
 * When tsx transforms @vitest/eslint-plugin's CommonJS distribution,
 * import.meta.url becomes 'about:blank', causing new URL('index.cjs', import.meta.url)
 * to fail with Invalid URL error.
 *
 * NOTE: The error occurs specifically when ESLint configs are loaded through the plugin
 * system (via code-pushup.config.ts -> configureEslintPlugin() -> loadConfigByPath()).
 * Direct imports of @code-pushup/eslint-config/vitest.js or @vitest/eslint-plugin work fine.
 *
 * Run with:
 *   TSX_TSCONFIG_PATH=tsconfig.base.json node --import tsx tools/jiti/vitest/issue-vitest.ts
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

console.log('=== Closer mimic: loadConfigByPath() directly ===');
console.log('Calling loadConfigByPath() -> loads configs');
console.log('This should trigger the error with fewer steps');
console.log('');

// Closer mimic: Replicate loadConfigByPath() logic using dynamic import
// This mimics what loadConfigByPath() does (before the fix)
// When tsx transforms the ESLint config and its dependencies, the error occurs
const eslintConfigPath = path.join(process.cwd(), 'eslint.config.js');
const eslintConfigUrl = pathToFileURL(eslintConfigPath).toString();
const eslintConfig = await import(eslintConfigUrl);

// If we reach here, the import succeeded - reproduction failed
console.log(
  'Reproduction failed: loadConfigByPath() loaded config without errors',
);
console.log(
  'Config length:',
  Array.isArray(eslintConfig.default) ? eslintConfig.default.length : 'N/A',
);

console.log('');
console.log('=== Old mimic: Full import chain ===');
console.log(
  'Attempting to import code-pushup.config.ts (same as nx code-pushup)...',
);
console.log('This will trigger the full import chain:');
console.log('  code-pushup.config.ts -> configureEslintPlugin()');
console.log('  -> eslintConfigFromAllNxProjects() -> finds eslint.config.js');
console.log('  -> loadConfigByPath() -> loads configs');
console.log(
  '  -> eslint.config.js -> @code-pushup/eslint-config/vitest.js -> @vitest/eslint-plugin',
);
console.log('');

// Mimic what the CLI does - load code-pushup.config.ts using loadConfigByPath() pattern
// This is what triggers the error in the actual nx code-pushup command
const configPath = path.join(process.cwd(), 'code-pushup.config.ts');
const url = pathToFileURL(configPath).toString();
// Use loadConfigByPath() pattern: dynamic import with pathToFileURL
const config = await import(url);

// If we reach here, the import succeeded - reproduction failed
console.log('Reproduction failed: code-pushup.config.ts loaded without errors');
console.log(
  'Config type:',
  typeof config.default !== 'undefined' ? 'default export' : 'direct export',
);
