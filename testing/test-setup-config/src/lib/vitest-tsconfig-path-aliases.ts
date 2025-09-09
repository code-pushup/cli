import { loadConfig } from 'tsconfig-paths';
import type { Alias, AliasOptions } from 'vite';

export function tsconfigPathAliases(projectRootUrl?: URL): AliasOptions {
  const tsconfigPath = projectRootUrl
    ? new URL('tsconfig.base.json', projectRootUrl).pathname
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
          ? new URL(relativePath, projectRootUrl).pathname
          : new URL(`../${relativePath}`, import.meta.url).pathname,
      }),
    );
}
