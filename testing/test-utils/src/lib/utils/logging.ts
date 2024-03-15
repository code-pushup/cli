import type { Logger } from '@poppinss/cliui';

export function getLogMessages(logger: Logger): string[] {
  return logger
    .getRenderer()
    .getLogs()
    .map(({ message }) =>
      message
        // removed ASCII colors
        .replace(/\u001B\[\d+m/g, ''),
    );
}
