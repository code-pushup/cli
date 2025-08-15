import path from 'node:path';
import { loadConfig } from 'tsconfig-paths';
import type { Alias, AliasOptions } from 'vite';

export function tsconfigPathAliases(): AliasOptions {
  const result = loadConfig('tsconfig.base.json');
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
        replacement: path.resolve(relativePath),
      }),
    );
}
