import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from 'tsconfig-paths';
import type { Alias, AliasOptions } from 'vite';

export function tsconfigPathAliases(projectRootUrl?: URL): AliasOptions {
  const tsconfigPath = projectRootUrl
    ? path.resolve(fileURLToPath(projectRootUrl), 'tsconfig.base.json')
    : 'tsconfig.base.json';
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
        replacement: projectRootUrl
          ? path.resolve(fileURLToPath(projectRootUrl), relativePath)
          : new URL(`../${relativePath}`, import.meta.url).pathname,
      }),
    );
}
