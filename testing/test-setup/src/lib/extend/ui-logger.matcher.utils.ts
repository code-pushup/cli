import type { LoggingTypes } from '@poppinss/cliui/build/src/types';
import { removeColorCodes } from '@code-pushup/test-utils';

export type LogLevel = Exclude<LoggingTypes, 'warning'> | 'warn';

const LOG_LEVELS = new Set<LogLevel>([
  'success',
  'error',
  'fatal',
  'info',
  'debug',
  'await',
  'warn',
]);

type ExtractedMessage = {
  styledMessage: string;
  unstyledMessage: string;
};

export function extractLevel(log: string): LogLevel | null {
  const match = removeColorCodes(log).match(/^\[\s*\w+\((?<level>\w+)\)\s*]/);
  const level = match?.groups?.['level'] as LogLevel | undefined;
  return level && LOG_LEVELS.has(level) ? level : null;
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
  expected: string,
  message: ExtractedMessage | undefined,
): boolean {
  if (!message) {
    return false;
  }
  return (
    message.styledMessage === expected || message.unstyledMessage === expected
  );
}

export function messageContains(
  expected: string,
  message: ExtractedMessage | undefined,
): boolean {
  if (!message) {
    return false;
  }
  return (
    message.styledMessage.includes(expected) ||
    message.unstyledMessage.includes(expected)
  );
}
