import path from 'node:path';
import { loadConfig } from 'tsconfig-paths';
import type { Alias, AliasOptions } from 'vite';

/**
 * Loads TypeScript path aliases from tsconfig.base.json for use in Vitest.
 * Uses process.cwd() as the workspace root to load the tsconfig.
 */
export function tsconfigPathAliases(): AliasOptions {
  const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.base.json');
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
        // Make paths relative to workspace root (../../ from config file)
        replacement: path.resolve(process.cwd(), relativePath),
      }),
    );
}
