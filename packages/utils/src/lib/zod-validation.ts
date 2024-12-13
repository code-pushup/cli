import { bold, red } from 'ansis';
import type { MessageBuilder } from 'zod-validation-error';

export function formatErrorPath(errorPath: (string | number)[]): string {
  return errorPath
    .map((key, index) => {
      if (typeof key === 'number') {
        return `[${key}]`;
      }
      return index > 0 ? `.${key}` : key;
    })
    .join('');
}

export const zodErrorMessageBuilder: MessageBuilder = issues =>
  issues
    .map(issue => {
      const formattedMessage = red(`${bold(issue.code)}: ${issue.message}`);
      const formattedPath = formatErrorPath(issue.path);
      if (formattedPath) {
        return `Validation error at ${bold(formattedPath)}\n${formattedMessage}\n`;
      }
      return `${formattedMessage}\n`;
    })
    .join('\n');
