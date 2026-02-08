import type { Tree } from '@nx/devkit';
import { minimatch } from 'minimatch';
import * as path from 'node:path';

export function getFirstExistingTsConfig(
  tree: Tree,
  projectRoot: string,
  options?: {
    tsconfigType?: string | string[];
  },
): string | undefined {
  const { tsconfigType = ['lib'] } = options ?? {};
  const supportedTypeNames = [
    ...new Set([
      ...(Array.isArray(tsconfigType) ? tsconfigType : [tsconfigType]),
      'lib',
      'none',
    ]),
  ];
  const existingType = supportedTypeNames.find(type =>
    tree.exists(
      path.join(
        projectRoot,
        type === 'none' ? `tsconfig.json` : `tsconfig.${type}.json`,
      ),
    ),
  );
  return existingType
    ? path.join(
        projectRoot,
        existingType === 'none'
          ? `tsconfig.json`
          : `tsconfig.${existingType}.json`,
      )
    : undefined;
}

/**
 * Finds all tsconfig files in a project directory matching a glob pattern.
 *
 * @param tree - The Nx Tree
 * @param projectRoot - The project root directory
 * @param pattern - Optional glob pattern to match tsconfig files (default: "tsconfig*.json")
 * @returns Array of tsconfig file paths relative to project root
 */
export function findAllTsconfigFiles(
  tree: Tree,
  projectRoot: string,
  pattern: string = 'tsconfig*.json',
): string[] {
  const files: string[] = [];

  try {
    const projectFiles = tree.children(projectRoot);
    for (const file of projectFiles) {
      if (
        file.startsWith('tsconfig') &&
        file.endsWith('.json') &&
        minimatch(file, pattern)
      ) {
        files.push(file);
      }
    }
  } catch {
    // If project root doesn't exist or can't be read, return empty array
    return [];
  }

  return files.sort();
}
