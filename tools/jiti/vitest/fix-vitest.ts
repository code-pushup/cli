/**
 * Fix for @vitest/eslint-plugin TypeError: Invalid URL issue when using tsx loader.
 *
 * PROBLEM:
 * When tsx transforms @vitest/eslint-plugin's CommonJS distribution,
 * import.meta.url becomes 'about:blank', causing new URL('index.cjs', import.meta.url)
 * to fail with Invalid URL error.
 *
 * SOLUTION:
 * Use jiti's importModule instead of dynamic import() when loading ESLint config files.
 * This ensures that jiti's nativeModules configuration is respected, preventing
 * @vitest/eslint-plugin from being transformed.
 *
 * The fix is implemented in:
 * packages/plugin-eslint/src/lib/meta/versions/flat.ts - loadConfigByPath()
 *
 * Instead of:
 *   const mod = await import(url);
 *
 * Use:
 *   const mod = await importModule({ filepath: absolutePath });
 *
 * This ensures that when ESLint configs are loaded, jiti handles the import
 * and respects the nativeModules list (which includes @vitest/eslint-plugin),
 * preventing tsx from transforming the CommonJS file.
 */
import path from 'node:path';
import { importModule } from '@code-pushup/utils';

/**
 * Example: Loading an ESLint config file using jiti instead of dynamic import
 * This ensures @vitest/eslint-plugin is loaded natively without transformation
 */
export async function loadEslintConfigSafely(configPath: string) {
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  // Use jiti's importModule instead of dynamic import to ensure nativeModules
  // (like @vitest/eslint-plugin) are loaded without transformation.
  // This prevents import.meta.url from becoming 'about:blank' when tsx transforms CommonJS files.
  const mod = await importModule({
    filepath: absolutePath,
    tsconfig: 'tsconfig.base.json',
  });

  return 'default' in mod ? mod.default : mod;
}

/**
 * Note: The actual fix is implemented in:
 * packages/plugin-eslint/src/lib/meta/versions/flat.ts
 *
 * The loadConfigByPath function was updated to use importModule instead of dynamic import.
 * This ensures that when ESLint configs are loaded through the plugin system,
 * jiti handles the import and respects the nativeModules configuration.
 */
