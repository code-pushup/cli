import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from 'tsconfig-paths';
import type { Alias, AliasOptions } from 'vite';

/**
 * Loads TypeScript path aliases from tsconfig.base.json for use in Vitest.
 * Searches up the directory tree to find tsconfig.base.json.
 */
export function tsconfigPathAliases(): AliasOptions {
  // Search up the directory tree for tsconfig.base.json
  let currentDir = process.cwd();
  let tsconfigPath: string | null = null;

  while (currentDir !== path.dirname(currentDir)) {
    // Stop at root
    const baseConfigPath = path.join(currentDir, 'tsconfig.base.json');
    if (fs.existsSync(baseConfigPath)) {
      tsconfigPath = baseConfigPath;
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  if (!tsconfigPath) {
    throw new Error('Could not find tsconfig.base.json in directory tree');
  }

  const result = loadConfig(tsconfigPath);

  if (result.resultType === 'failed') {
    throw new Error(
      `Failed to load path aliases from tsconfig for Vitest: ${result.message}`,
    );
  }

  return Object.entries(result.paths)
    .map(([key, value]) => [key, value[0]])
    .filter((pair): pair is [string, string] => pair[1] != null)
    .map(
      ([importPath, relativePath]): Alias => ({
        find: importPath,
        // Use absolute base URL from tsconfig for proper resolution
        replacement: path.resolve(result.absoluteBaseUrl, relativePath),
      }),
    );
}
