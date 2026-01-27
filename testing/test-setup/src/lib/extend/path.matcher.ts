import type { SyncExpectationResult } from '@vitest/expect';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';

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

async function assertDirectoryStructure(
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
