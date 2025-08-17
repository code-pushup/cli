import type { Logger } from '@poppinss/cliui';
import type { LoggingTypes } from '@poppinss/cliui/build/src/types';
import { removeColorCodes } from '@code-pushup/test-utils';

export type LogLevel = Exclude<LoggingTypes, 'warning'> | 'warn' | 'log';

export type ExpectedMessage =
  | string
  | { asymmetricMatch: (value: string) => boolean };

type ExtractedMessage = {
  styledMessage: string;
  unstyledMessage: string;
};

type LogDetails = {
  level: LogLevel;
  message: ExtractedMessage;
};

const LOG_LEVELS = new Set<LogLevel>([
  'success',
  'error',
  'fatal',
  'info',
  'debug',
  'await',
  'warn',
  'log',
]);

export function extractLogDetails(logger: Logger): LogDetails[] {
  return logger
    .getRenderer()
    .getLogs()
    .map(
      ({ message }): LogDetails => ({
        level: extractLevel(message),
        message: extractMessage(message),
      }),
    );
}

export function extractLevel(log: string): LogLevel {
  const match = removeColorCodes(log).match(/^\[\s*\w+\((?<level>\w+)\)\s*]/);
  const level = match?.groups?.['level'] as LogLevel | undefined;
  return level && LOG_LEVELS.has(level) ? level : 'log';
}

export function extractMessage(log: string): ExtractedMessage {
  const match = log.match(
    /^\[\s*\w+\((?<level>\w+)\)\s*]\s*(?<message>.+?(\.\s*)?)$/,
  );
  const styledMessage = match?.groups?.['message'] ?? log;
  const unstyledMessage = removeColorCodes(styledMessage);
  return { styledMessage, unstyledMessage };
}

export function hasExpectedMessage(
  expected: ExpectedMessage,
  message: ExtractedMessage | undefined,
): boolean {
  if (!message) {
    return false;
  }
  if (isAsymmetricMatcher(expected)) {
    return (
      expected.asymmetricMatch(message.styledMessage) ||
      expected.asymmetricMatch(message.unstyledMessage)
    );
  }
  return (
    message.styledMessage === expected || message.unstyledMessage === expected
  );
}

function isAsymmetricMatcher(
  value: unknown,
): value is { asymmetricMatch: (input: string) => boolean } {
  return (
    typeof value === 'object' && value != null && 'asymmetricMatch' in value
  );
}
