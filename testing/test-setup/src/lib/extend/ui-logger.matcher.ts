import { cliui } from '@poppinss/cliui';
import type { SyncExpectationResult } from '@vitest/expect';
import { expect } from 'vitest';
import {
  type ExpectedMessage,
  type LogLevel,
  extractLogDetails,
  hasExpectedMessage,
} from './ui-logger.matcher.utils';

type CliUi = ReturnType<typeof cliui>;

export type CustomUiLoggerMatchers = {
  toHaveLogged: (level: LogLevel, message: ExpectedMessage) => void;
  toHaveNthLogged: (
    nth: number,
    level: LogLevel,
    message: ExpectedMessage,
  ) => void;
  toHaveLoggedTimes: (times: number) => void;
  toHaveLogs: () => void;
};

expect.extend({
  toHaveLogged: assertLogged,
  toHaveNthLogged: assertNthLogged,
  toHaveLoggedTimes: assertLogCount,
  toHaveLogs: assertLogs,
});

function assertLogged(
  actual: CliUi,
  level: LogLevel,
  message: ExpectedMessage,
): SyncExpectationResult {
  const logs = extractLogDetails(actual.logger);

  const pass = logs.some(
    log => log.level === level && hasExpectedMessage(message, log.message),
  );
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to find a log with level "${level}" and message matching: ${message}`
        : `Expected a log with level "${level}" and message matching: ${message}`,
  };
}

function assertNthLogged(
  actual: CliUi,
  nth: number,
  level: LogLevel,
  message: ExpectedMessage,
): SyncExpectationResult {
  const log = extractLogDetails(actual.logger)[nth - 1];

  const pass = log?.level === level && hasExpectedMessage(message, log.message);
  return {
    pass,
    message: () =>
      pass
        ? `Expected not to find a log at position ${nth} with level "${level}" and message matching: ${message}`
        : `Expected a log at position ${nth} with level "${level}" and message matching: ${message}`,
  };
}

function assertLogs(actual: CliUi): SyncExpectationResult {
  const logs = actual.logger.getRenderer().getLogs();

  const pass = logs.length > 0;
  return {
    pass,
    message: () =>
      pass
        ? `Expected no logs, but found ${logs.length}`
        : `Expected some logs, but no logs were produced`,
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
        ? `Expected not to find exactly ${expected} logs, but found ${logs.length}`
        : `Expected exactly ${expected} logs, but found ${logs.length}`,
  };
}
