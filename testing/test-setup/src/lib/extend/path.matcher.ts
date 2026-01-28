import type { SyncExpectationResult } from '@vitest/expect';
import { expect } from 'vitest';
import { osAgnosticPath } from '@code-pushup/test-utils';

export type CustomPathMatchers = {
  toMatchPath: (path: string) => void;
  toStartWithPath: (path: string) => void;
  toContainPath: (path: string) => void;
  toEndWithPath: (path: string) => void;
};

export type CustomAsymmetricPathMatchers = {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  pathToMatch: (path: string) => any;
  pathToStartWith: (path: string) => any;
  pathToContain: (path: string) => any;
  pathToEndWith: (path: string) => any;
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
