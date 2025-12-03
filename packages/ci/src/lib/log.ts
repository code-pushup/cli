import ansis from 'ansis';
import {
  CODE_PUSHUP_UNICODE_LOGO,
  logger,
  transformLines,
} from '@code-pushup/utils';

const LOG_PREFIX = ansis.bold.blue(CODE_PUSHUP_UNICODE_LOGO);

/**
 * Logs error message with top-level CI log styles (lines prefixed with logo, ends in empty line).
 * @param message Log message
 */
export function logError(message: string): void {
  log('error', message);
}

/**
 * Logs warning message with top-level CI log styles (lines prefixed with logo, ends in empty line).
 * @param message Log message
 */
export function logWarning(message: string): void {
  log('warn', message);
}

/**
 * Logs info message with top-level CI log styles (lines prefixed with logo, ends in empty line).
 * @param message Log message
 */
export function logInfo(message: string): void {
  log('info', message);
}

/**
 * Logs debug message with top-level CI log styles (lines prefixed with logo, ends in empty line).
 * @param message Log message
 */
export function logDebug(message: string): void {
  log('debug', message);
}

/**
 * Prefixes CI logs with logo and ensures each CI log is followed by an empty line.
 * This is to make top-level CI logs more visually distinct from printed process logs.
 * @param level Log level
 * @param message Log message
 */
export function log(
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
): void {
  const prefixedLines = transformLines(
    message.trim(),
    line => `${LOG_PREFIX} ${line}`,
  );
  const styledMessage = `${prefixedLines}\n`;

  logger[level](styledMessage);
}
