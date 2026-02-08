import { type Tree, readJson } from '@nx/devkit';
import type { RootBuilder } from './builder-system';
import {
  arr,
  array,
  createRootBuilder,
  obj,
  object,
  unset,
} from './builder-system';
import {
  projectSubstitutions,
  substituteVariablesInObject,
} from './substitution';
import type { BaselineConfig, Diagnostic, SyncResult, Updater } from './types';
import {
  findMatchingFile,
  pathSubstitutions,
  substitutePathsInArray,
} from './utils';

// Re-export types and functions for backward compatibility
export type {
  Diagnostic,
  SyncResult,
  BaselineConfig,
  Updater,
  UnsetMarker,
} from './types';

export type {
  ObjectMutation,
  ArrayMutation,
  RootBuilder,
} from './builder-system';

export {
  object,
  array,
  obj,
  arr,
  unset,
  createRootBuilder,
} from './builder-system';

export { pipe } from './updater-system';

/**
 * Creates a typed JSON baseline configuration
 */
export const createJsonBaselineTyped = <T extends object>(o: {
  matcher: string | string[];
  fileName: string;
  projects?: string[];
  baseline: (root: RootBuilder<T>) => void;
}): BaselineConfig => {
  const matchers = Array.isArray(o.matcher) ? o.matcher : [o.matcher];

  // When matcher contains path separators, extract just the filename for scoped tree matching
  const scopedMatchers = matchers.map(m => {
    if (m.includes('/')) {
      // Extract filename from path pattern (e.g., '**/testing/**/package.json' -> 'package.json')
      return m.split('/').pop() || m;
    }
    return m;
  });

  // Only add 'tsconfig.json' as fallback if fileName is 'tsconfig.json'
  // This prevents baselines for specific files (like tsconfig.tools.json) from matching tsconfig.json
  const fileMatcher: string[] = Array.from(
    new Set([
      ...scopedMatchers,
      ...(o.fileName === 'tsconfig.json' ? ['tsconfig.json'] : []),
    ]),
  );

  const rootBuilder = createRootBuilder<T>();
  o.baseline(rootBuilder);
  const updater = rootBuilder.__updater;

  return {
    projects: o.projects,
    filePath: o.fileName,
    matcher: o.matcher,
    sync(tree) {
      let diagnostics: Diagnostic[] = [];

      const path = findMatchingFile(
        tree as Tree & { children?: (path: string) => string[] },
        fileMatcher,
      );

      if (!path) {
        return diagnostics;
      }

      const current = readJson(tree, path);

      const result = updater(current, '');

      diagnostics = [...diagnostics, ...result.diagnostics];

      let finalValue = { ...result.value } as Record<string, unknown>;

      // Apply path substitutions to include/exclude arrays
      const include = finalValue.include;
      if (Array.isArray(include)) {
        finalValue.include = substitutePathsInArray(
          include,
          pathSubstitutions,
          path,
        );
      }
      const exclude = finalValue.exclude;
      if (Array.isArray(exclude)) {
        finalValue.exclude = substitutePathsInArray(
          exclude,
          pathSubstitutions,
          path,
        );
      }

      // Apply project-specific substitutions (like {projectName}, {packageName}) to all string values
      finalValue = substituteVariablesInObject(
        finalValue,
        projectSubstitutions,
        path,
        tree,
      ) as Record<string, unknown>;

      // Note: We don't write to the tree here - that's done by the sync command
      // This function only reports what needs to change

      // Check if this is a rename scenario (matched file != desired fileName)
      const pathFileName = path.split('/').pop() || '';
      const isRename = pathFileName !== o.fileName;

      return {
        diagnostics,
        matchedFile: path,
        baselineValue: finalValue, // Always return baselineValue for diffing
        ...(isRename ? { renamedFrom: path } : {}),
      };
    },
  };
};

/**
 * Creates a simple JSON baseline from a config object
 */
export function createJsonBaseline(
  fileName: string,
  config: {
    tags?: string[];
    renameFrom?: string;
    [key: string]: any;
  },
): BaselineConfig {
  const { tags, renameFrom, ...baselineProps } = config;

  const baseConfig = createJsonBaselineTyped({
    matcher: fileName,
    fileName: fileName,
    baseline: root => root.set(baselineProps),
  });

  // Create a new config with additional properties
  const extendedConfig: BaselineConfig = {
    ...baseConfig,
    tags,
  };

  // Wrap the sync method to handle renaming
  if (renameFrom) {
    const originalSync = baseConfig.sync.bind(baseConfig);
    extendedConfig.sync = (tree: Tree) => {
      const renameFromMatchers = Array.isArray(renameFrom)
        ? renameFrom
        : [renameFrom];

      // Check if the file to rename exists
      const renameFromPath = findMatchingFile(
        tree as Tree & { children?: (path: string) => string[] },
        renameFromMatchers,
      );

      // Note: We don't actually rename the file here - that's done by the sync command
      // This function only reports what needs to change

      // If there's a file to rename, we need to sync against the OLD file content
      // But originalSync will try to find the NEW filename, so we need to create a wrapper tree
      let result;
      if (renameFromPath) {
        // Create a wrapper tree that makes the old file appear as the new filename
        const wrapperTree = {
          ...tree,
          exists: (p: string) =>
            p === fileName ? tree.exists(renameFromPath) : tree.exists(p),
          read: (p: string, encoding?: BufferEncoding) =>
            p === fileName
              ? tree.read(renameFromPath, encoding ?? 'utf-8')
              : tree.read(p, encoding ?? 'utf-8'),
          write: (p: string, c: Buffer | string) => tree.write(p, c),
          delete: (p: string) => tree.delete(p),
          children: tree.children,
        };

        result = originalSync(wrapperTree as any);
      } else {
        result = originalSync(tree);
      }

      // Add rename info to result
      if (
        renameFromPath &&
        typeof result === 'object' &&
        'diagnostics' in result
      ) {
        return {
          ...result,
          renamedFrom: renameFromPath,
          // Override matchedFile to be the old file for diffing purposes
          matchedFile: renameFromPath,
        };
      }

      return result;
    };
  }

  return extendedConfig;
}
