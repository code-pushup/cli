import type { Logger } from '@poppinss/cliui';

export function getLogMessages(logger: Logger): string[] {
  return logger
    .getRenderer()
    .getLogs()
    .map(({ message }) =>
      message
        // removed ASCII colors
        // eslint-disable-next-line no-control-regex
        .replace(/\u001B\[\d+m/g, ''),
    );
}
