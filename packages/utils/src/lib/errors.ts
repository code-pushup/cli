import { ZodError, z } from 'zod';
import { UNICODE_ELLIPSIS, truncateMultilineText } from './formatting.js';

export function stringifyError(
  error: unknown,
  format?: { oneline: boolean },
): string {
  const truncate = (text: string) =>
    format?.oneline ? truncateMultilineText(text) : text;

  if (error instanceof ZodError) {
    const formattedError = z.prettifyError(error);
    if (formattedError.includes('\n')) {
      if (format?.oneline) {
        return `${error.name} [${UNICODE_ELLIPSIS}]`;
      }
      return `${error.name}:\n${formattedError}\n`;
    }
    return `${error.name}: ${formattedError}`;
  }

  if (error instanceof Error) {
    if (error.name === 'Error' || error.message.startsWith(error.name)) {
      return truncate(error.message);
    }
    return truncate(`${error.name}: ${error.message}`);
  }
  if (typeof error === 'string') {
    return truncate(error);
  }
  return JSON.stringify(error);
}

/**
 * Extend an error with a new mamessage and keeps the original as cause.
 * @param error - The error to extend
 * @param message - The new message to add to the error
 * @returns A new error with the extended message and the original as cause
 */
export function extendError(
  error: unknown,
  message: string,
  { appendMessage = false } = {},
) {
  const errorMessage = appendMessage
    ? `${message}\n${stringifyError(error)}`
    : message;
  return new Error(errorMessage, { cause: error });
}
