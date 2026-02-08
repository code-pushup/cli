import { type Tree } from '@nx/devkit';
import { minimatch } from 'minimatch';
import { dirname } from 'path';

/**
 * Resolves a path relative to repo root to a path relative to the tsconfig file location.
 * Calculates the correct relative path based on the depth of the tsconfig file.
 *
 * @param repoRootPath - Path relative to repo root (e.g., 'testing/test-setup/src/vitest.d.ts')
 * @param tsconfigPath - Path to the tsconfig.json file (e.g., 'packages/my-package/tsconfig.test.json')
 * @returns Path relative to tsconfig location (e.g., '../../testing/test-setup/src/vitest.d.ts')
 */
export const resolveRepoRootPath = (
  repoRootPath: string,
  tsconfigPath: string,
): string => {
  const tsconfigDir = dirname(tsconfigPath);

  // Count depth: how many directory levels deep is the tsconfig?
  // e.g., 'packages/my-package/tsconfig.test.json' -> depth 2
  const depth = tsconfigDir.split('/').filter(Boolean).length;

  // Build relative path: go up 'depth' levels, then to repo root path
  const upPath = '../'.repeat(depth) + repoRootPath;

  return upPath;
};

export const pathSubstitutions = { 'repo:': resolveRepoRootPath };

/**
 * Substitutes paths in an array of strings based on configurable prefix mappings.
 *
 * @param array - The array to process (can contain mixed types)
 * @param substitutions - Mapping of prefixes to substitution functions
 * @param contextPath - Context path passed to substitution functions
 * @returns New array with substituted paths
 *
 * @example
 * ```typescript
 * substitutePathsInArray(
 *   ['repo:src/index.ts', 'other/file.ts'],
 *   { 'repo:': resolveRepoRootPath },
 *   'packages/my-package/tsconfig.json'
 * )
 * // Returns: ['../../src/index.ts', 'other/file.ts']
 * ```
 */
export const substitutePathsInArray = (
  array: unknown[],
  substitutions: Record<string, (path: string, contextPath: string) => string>,
  contextPath: string,
): unknown[] => {
  return array.map(value => {
    if (typeof value === 'string') {
      for (const [prefix, substituter] of Object.entries(substitutions)) {
        if (value.startsWith(prefix)) {
          return substituter(value.slice(prefix.length), contextPath);
        }
      }
    }
    return value;
  });
};

/**
 * Converts regex alternation pattern (a|b|c) to glob brace expansion {a,b,c}
 * for minimatch compatibility.
 *
 * @param pattern - Pattern string that may contain regex alternation syntax
 * @returns Pattern with regex alternation converted to glob brace expansion
 *
 * @example
 * ```typescript
 * convertRegexToGlob('tsconfig.(tools|perf).json')
 * // Returns: 'tsconfig.{tools,perf}.json'
 * ```
 */
export const convertRegexToGlob = (pattern: string): string => {
  return pattern.replace(/\(([^)]+)\)/g, (match, content) => {
    // Check if it contains alternation (|)
    if (content.includes('|')) {
      return `{${content.split('|').join(',')}}`;
    }
    return match; // Return original if no alternation
  });
};

/**
 * Checks if a string is a pattern (contains glob/regex special characters).
 *
 * @param str - String to check
 * @returns True if the string contains pattern characters, false otherwise
 *
 * @example
 * ```typescript
 * isPattern('tsconfig.json') // false
 * isPattern('tsconfig.*.json') // true
 * isPattern('tsconfig.(tools|perf).json') // true
 * ```
 */
export const isPattern = (str: string): boolean => {
  return /[*?{}\[\]()|]/.test(str);
};

/**
 * Finds a file matching the given pattern(s).
 * Supports both exact paths and glob patterns.
 *
 * @param tree - The Nx Tree (may have a children method)
 * @param patterns - Single pattern string or array of pattern strings to match
 * @returns The matched file path, or null if no match found
 *
 * @example
 * ```typescript
 * findMatchingFile(tree, 'tsconfig.json') // Exact match
 * findMatchingFile(tree, ['tsconfig.(tools|perf).json', 'tsconfig.json']) // Pattern match
 * ```
 */
export const findMatchingFile = (
  tree: Tree & { children?: (path: string) => string[] },
  patterns: string | string[],
): string | null => {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  for (const pattern of patternArray) {
    // Try exact match first
    if (!isPattern(pattern) && tree.exists(pattern)) {
      return pattern;
    }

    // If it's a pattern, try to match against files in current directory
    if (isPattern(pattern)) {
      try {
        // Get children of current directory (scopedTree provides children relative to project root)
        const children = tree.children ? tree.children('.') : [];

        // Convert regex alternation to glob brace expansion for minimatch
        const globPattern = convertRegexToGlob(pattern);

        // Find first matching file
        const matched = children.find((file: string) =>
          minimatch(file, globPattern),
        );

        if (matched) {
          return matched;
        }
      } catch {
        // If children() fails or directory doesn't exist, continue to next pattern
        continue;
      }
    }
  }

  return null;
};
