import type { SyncExpectationResult } from '@vitest/expect';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';

// Symbol to identify matcher keys in structure objects
const MATCHER_KEY_SYMBOL = Symbol('fsMatcherKey');

// Type for matcher key wrapper
export type MatcherKey = {
  [MATCHER_KEY_SYMBOL]: true;
  matcher: unknown;
};

// Helper function to create a matcher key
export function fsMatcherKey(matcher: unknown): MatcherKey {
  return {
    [MATCHER_KEY_SYMBOL]: true,
    matcher,
  };
}

// Type for filesystem structure
export type FsStructure = {
  [key: string | symbol]: true | FsStructure;
};

export type CustomPathMatchers = {
  toMatchPath: (path: string) => void;
  toStartWithPath: (path: string) => void;
  toContainPath: (path: string) => void;
  toEndWithPath: (path: string) => void;
  toMatchDirectoryStructure: (patterns: (string | RegExp)[]) => void;
};

export type CustomAsymmetricPathMatchers = {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  pathToMatch: (path: string) => any;
  pathToStartWith: (path: string) => any;
  pathToContain: (path: string) => any;
  pathToEndWith: (path: string) => any;
  directoryToMatchStructure: (patterns: (string | RegExp)[]) => any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
};

expect.extend({
  toMatchPath: assertPathMatch,
  pathToMatch: assertPathMatch,
  toStartWithPath: assertPathStartWith,
  pathToStartWith: assertPathStartWith,
  toContainPath: assertPathContain,
  pathToContain: assertPathContain,
  toEndWithPath: assertPathEndWith,
  pathToEndWith: assertPathEndWith,
  toMatchDirectoryStructure: assertDirectoryStructure,
  directoryToMatchStructure: assertDirectoryStructure,
});

function assertPathMatch(
  actual: string,
  expected: string,
): SyncExpectationResult {
  const normalizedReceived = osAgnosticPath(actual);
  const normalizedExpected = osAgnosticPath(expected);

  const pass = normalizedReceived === normalizedExpected;
  return pass
    ? {
        message: () => `expected ${actual} not to match path ${expected}`,
        pass: true,
        actual,
        expected,
      }
    : {
        message: () => `expected ${actual} to match path ${expected}`,
        pass: false,
        actual,
        expected,
      };
}

function assertPathStartWith(
  actual: string,
  expected: string,
): SyncExpectationResult {
  const normalizedReceived = osAgnosticPath(actual);
  const normalizedExpected = osAgnosticPath(expected);

  const pass = normalizedReceived.startsWith(normalizedExpected);
  return pass
    ? {
        message: () => `expected ${actual} not to start with path ${expected}`,
        pass: true,
        actual,
        expected,
      }
    : {
        message: () => `expected ${actual} to start with path ${expected}`,
        pass: false,
        actual,
        expected,
      };
}

function assertPathContain(
  actual: string,
  expected: string,
): SyncExpectationResult {
  const normalizedReceived = osAgnosticPath(actual);
  const normalizedExpected = osAgnosticPath(expected);

  const pass = normalizedReceived.includes(normalizedExpected);
  return pass
    ? {
        message: () => `expected ${actual} not to contain path ${expected}`,
        pass: true,
        actual,
        expected,
      }
    : {
        message: () => `expected ${actual} to contain path ${expected}`,
        pass: false,
        actual,
        expected,
      };
}

function assertPathEndWith(
  actual: string,
  expected: string,
): SyncExpectationResult {
  const normalizedReceived = osAgnosticPath(actual);
  const normalizedExpected = osAgnosticPath(expected);

  const pass = normalizedReceived.endsWith(normalizedExpected);
  return pass
    ? {
        message: () => `expected ${actual} not to end with path ${expected}`,
        pass: true,
        actual,
        expected,
      }
    : {
        message: () => `expected ${actual} to end with path ${expected}`,
        pass: false,
        actual,
        expected,
      };
}

async function readDirectoryStructure(
  directory: string,
  baseDir: string = directory,
): Promise<string[]> {
  const entries: string[] = [];
  const items = await readdir(directory);

  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = await stat(itemPath);
    const relativePath = path.relative(baseDir, itemPath);
    const normalizedPath = osAgnosticPath(relativePath);

    // Add the current item (file or folder)
    entries.push(normalizedPath);

    // Recursively process subdirectories
    if (stats.isDirectory()) {
      const subEntries = await readDirectoryStructure(itemPath, baseDir);
      entries.push(...subEntries);
    }
  }

  return entries;
}

export async function assertDirectoryStructure(
  actual: string,
  expected: (string | RegExp)[],
): Promise<SyncExpectationResult> {
  try {
    const actualStructure = await readDirectoryStructure(actual);
    const unmatchedPatterns: (string | RegExp)[] = [];
    const matchedPaths: string[] = [];

    for (const pattern of expected) {
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      const matchingPaths = actualStructure.filter(path => regex.test(path));

      if (matchingPaths.length === 0) {
        unmatchedPatterns.push(pattern);
      } else {
        matchedPaths.push(...matchingPaths);
      }
    }

    const pass = unmatchedPatterns.length === 0;

    return pass
      ? {
          message: () =>
            `expected directory ${actual} not to match structure patterns`,
          pass: true,
          actual: actualStructure,
          expected,
        }
      : {
          message: () =>
            `expected directory ${actual} to match structure patterns\n` +
            `Unmatched patterns: ${unmatchedPatterns
              .map(p => (p instanceof RegExp ? p.toString() : p))
              .join(', ')}\n` +
            `Found paths: ${actualStructure.join(', ')}`,
          pass: false,
          actual: actualStructure,
          expected,
        };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      message: () =>
        `expected directory ${actual} to exist and be readable\n` +
        `Error: ${errorMessage}`,
      pass: false,
      actual,
      expected,
    };
  }
}

async function readDirectoryTree(
  directory: string,
): Promise<Record<string, boolean | Record<string, unknown>>> {
  const tree: Record<string, boolean | Record<string, unknown>> = {};
  const items = await readdir(directory);

  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = await stat(itemPath);

    if (stats.isDirectory()) {
      tree[item] = await readDirectoryTree(itemPath);
    } else {
      tree[item] = true;
    }
  }

  return tree;
}

function isMatcherKey(key: unknown): key is MatcherKey {
  return (
    typeof key === 'object' &&
    key !== null &&
    MATCHER_KEY_SYMBOL in key &&
    (key as MatcherKey)[MATCHER_KEY_SYMBOL] === true
  );
}

export async function assertFsMatchesStructure(
  actual: string,
  expected: FsStructure,
): Promise<SyncExpectationResult> {
  try {
    // Validate expected is an object
    if (typeof expected !== 'object' || expected === null) {
      return {
        message: () =>
          `expected structure must be an object, received ${typeof expected}`,
        pass: false,
        actual,
        expected,
      };
    }

    const actualTree = await readDirectoryTree(actual);
    const missingPaths: string[] = [];
    const errors: string[] = [];

    function checkStructure(
      actual: Record<string, boolean | Record<string, unknown>>,
      expected: FsStructure,
      currentPath: string = '',
    ): void {
      // Validate expected is an object
      if (typeof expected !== 'object' || expected === null) {
        errors.push(`Expected structure at "${currentPath}" must be an object`);
        return;
      }

      // Get all keys from expected structure (including symbol keys)
      const expectedKeys = [
        ...Object.keys(expected),
        ...Object.getOwnPropertySymbols(expected),
      ];

      for (const expectedKey of expectedKeys) {
        const expectedValue = expected[expectedKey];
        const fullPath = currentPath
          ? `${currentPath}/${String(expectedKey)}`
          : String(expectedKey);

        // Get actual keys (directory/file names)
        const actualKeys = Object.keys(actual);

        // For string keys, do synchronous matching
        if (typeof expectedKey === 'string') {
          const normalizedExpected = osAgnosticPath(expectedKey);
          const matched = actualKeys.find(
            key => osAgnosticPath(key) === normalizedExpected,
          );

          if (!matched) {
            missingPaths.push(fullPath);
            continue;
          }

          const actualValue = actual[matched];

          if (expectedValue === true) {
            // Expected a file
            if (typeof actualValue !== 'boolean') {
              missingPaths.push(fullPath);
              errors.push(`Expected file "${fullPath}" but found directory`);
            }
          } else if (
            typeof expectedValue === 'object' &&
            expectedValue !== null
          ) {
            // Expected a directory
            if (typeof actualValue !== 'object' || actualValue === null) {
              missingPaths.push(fullPath);
              errors.push(`Expected directory "${fullPath}" but found file`);
            } else {
              checkStructure(
                actualValue as Record<
                  string,
                  boolean | Record<string, unknown>
                >,
                expectedValue,
                fullPath,
              );
            }
          }
        } else if (isMatcherKey(expectedKey)) {
          // Handle matcher keys - need to check each actual key
          const matcherKey = expectedKey as MatcherKey;
          const matcher = matcherKey.matcher;
          let matched = false;
          let matchedKey: string | null = null;

          // Check if matcher has asymmetricMatch method
          if (
            typeof matcher === 'object' &&
            matcher !== null &&
            'asymmetricMatch' in matcher &&
            typeof (matcher as { asymmetricMatch: (value: unknown) => boolean })
              .asymmetricMatch === 'function'
          ) {
            const asymmetricMatcher = matcher as {
              asymmetricMatch: (value: unknown) => boolean;
            };
            matchedKey =
              actualKeys.find(key => asymmetricMatcher.asymmetricMatch(key)) ||
              null;
            matched = matchedKey !== null;
          }

          if (!matched || !matchedKey) {
            missingPaths.push(fullPath);
            errors.push(`No key matched matcher at path "${fullPath}"`);
            continue;
          }

          const actualValue = actual[matchedKey];

          if (expectedValue === true) {
            // Expected a file
            if (typeof actualValue !== 'boolean') {
              missingPaths.push(fullPath);
              errors.push(`Expected file "${fullPath}" but found directory`);
            }
          } else if (
            typeof expectedValue === 'object' &&
            expectedValue !== null
          ) {
            // Expected a directory
            if (typeof actualValue !== 'object' || actualValue === null) {
              missingPaths.push(fullPath);
              errors.push(`Expected directory "${fullPath}" but found file`);
            } else {
              checkStructure(
                actualValue as Record<
                  string,
                  boolean | Record<string, unknown>
                >,
                expectedValue,
                fullPath,
              );
            }
          }
        }
      }
    }

    checkStructure(actualTree, expected);

    const pass = missingPaths.length === 0;

    return pass
      ? {
          message: () => `expected directory ${actual} not to match structure`,
          pass: true,
          actual: actualTree,
          expected,
        }
      : {
          message: () =>
            `expected directory ${actual} to match structure\n` +
            `Missing paths: ${missingPaths.join(', ')}\n` +
            (errors.length > 0 ? `Errors: ${errors.join('; ')}\n` : '') +
            `Actual structure: ${JSON.stringify(actualTree, null, 2)}`,
          pass: false,
          actual: actualTree,
          expected,
        };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      message: () =>
        `expected directory ${actual} to exist and be readable\n` +
        `Error: ${errorMessage}`,
      pass: false,
      actual,
      expected,
    };
  }
}
