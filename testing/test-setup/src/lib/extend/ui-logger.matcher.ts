import { cliui } from '@poppinss/cliui';
import type { SyncExpectationResult } from '@vitest/expect';
import { expect } from 'vitest';
import {
  type LogLevel,
  extractLevel,
  extractMessage,
  hasExpectedMessage,
  messageContains,
} from './ui-logger.matcher.utils';

type CliUi = ReturnType<typeof cliui>;

export type CustomUiLoggerMatchers = {
  toHaveLoggedMessage: (expected: string) => void;
  toHaveLoggedNthMessage: (nth: number, expected: string) => void;
  toHaveLoggedLevel: (expected: LogLevel) => void;
  toHaveLoggedNthLevel: (nth: number, expected: LogLevel) => void;
  toHaveLoggedMessageContaining: (expected: string) => void;
  toHaveLoggedNthMessageContaining: (nth: number, expected: string) => void;
  toHaveLogged: () => void;
  toHaveLoggedTimes: (times: number) => void;
};

expect.extend({
  toHaveLoggedMessage: assertMessageLogged,
  toHaveLoggedNthMessage: assertNthMessageLogged,
  toHaveLoggedLevel: assertLevelLogged,
  toHaveLoggedNthLevel: assertNthLevelLogged,
  toHaveLoggedMessageContaining: assertMessageContaining,
  toHaveLoggedNthMessageContaining: assertNthMessageContaining,
  toHaveLogged: assertLogs,
  toHaveLoggedTimes: assertLogCount,
});

function assertMessageLogged(
  actual: CliUi,
  expected: string,
): SyncExpectationResult {
  const messages = actual.logger
    .getRenderer()
    .getLogs()
    .map(({ message }) => extractMessage(message));

  const pass = messages.some(msg => hasExpectedMessage(expected, msg));
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to have logged: ${expected}`
        : `Expected to have logged: ${expected}}`,
  };
}

function assertNthMessageLogged(
  actual: CliUi,
  nth: number,
  expected: string,
): SyncExpectationResult {
  const messages = actual.logger
    .getRenderer()
    .getLogs()
    .map(({ message }) => extractMessage(message));

  const pass = hasExpectedMessage(expected, messages[nth - 1]);
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to have logged at position ${nth}: ${expected}`
        : `Expected to have logged at position ${nth}: ${expected}`,
  };
}

function assertLevelLogged(
  actual: CliUi,
  expected: LogLevel,
): SyncExpectationResult {
  const levels = actual.logger
    .getRenderer()
    .getLogs()
    .map(({ message }) => extractLevel(message));

  const pass = levels.includes(expected);
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to have ${expected} log level`
        : `Expected to have ${expected} log level`,
  };
}

function assertNthLevelLogged(
  actual: CliUi,
  nth: number,
  expected: LogLevel,
): SyncExpectationResult {
  const levels = actual.logger
    .getRenderer()
    .getLogs()
    .map(({ message }) => extractLevel(message));

  const pass = levels[nth - 1] === expected;
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to have log level at position ${nth}: ${expected}`
        : `Expected to have log level at position ${nth}: ${expected}`,
  };
}

function assertMessageContaining(
  actual: CliUi,
  expected: string,
): SyncExpectationResult {
  const messages = actual.logger
    .getRenderer()
    .getLogs()
    .map(({ message }) => extractMessage(message));

  const pass = messages.some(msg => messageContains(expected, msg));
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to find a message containing: ${expected}`
        : `Expected to find a message containing: ${expected}, but none matched.`,
  };
}

function assertNthMessageContaining(
  actual: CliUi,
  nth: number,
  expected: string,
): SyncExpectationResult {
  const messages = actual.logger
    .getRenderer()
    .getLogs()
    .map(({ message }) => extractMessage(message));

  const pass = messageContains(expected, messages[nth - 1]);
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to find the fragment "${expected}" in the message at position ${nth}`
        : `Expected to find the fragment "${expected}" in the message at position ${nth}, but it was not found.`,
  };
}

function assertLogs(actual: CliUi): SyncExpectationResult {
  const logs = actual.logger.getRenderer().getLogs();

  const pass = logs.length > 0;
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to have any logs`
        : `Expected to have some logs, but no logs were produced`,
  };
}

function assertLogCount(
  actual: CliUi,
  expected: number,
): SyncExpectationResult {
  const logs = actual.logger.getRenderer().getLogs();

  const pass = logs.length === expected;
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to have exactly ${expected} logs`
        : `Expected to have ${expected} logs, but got ${logs.length}`,
  };
}
