import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from 'tsconfig-paths';
import type { Alias, AliasOptions } from 'vite';

/**
 * Finds the workspace root by searching upward for tsconfig.base.json or nx.json.
 */
function findWorkspaceRoot(startDir: string): string {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const tsconfigPath = path.join(currentDir, 'tsconfig.base.json');
    const nxJsonPath = path.join(currentDir, 'nx.json');
    if (fs.existsSync(tsconfigPath) || fs.existsSync(nxJsonPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error(
    `Could not find workspace root (tsconfig.base.json or nx.json) starting from ${startDir}`,
  );
}

/**
 * Loads TypeScript path aliases from tsconfig.base.json for use in Vitest.
 * Searches upward from process.cwd() to find the workspace root.
 */
export function tsconfigPathAliases(): AliasOptions {
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const tsconfigPath = path.join(workspaceRoot, 'tsconfig.base.json');
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
        // Make paths relative to workspace root
        replacement: path.resolve(workspaceRoot, relativePath),
      }),
    );
}
