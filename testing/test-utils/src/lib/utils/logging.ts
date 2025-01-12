import { Logger } from '@poppinss/cliui/build/index.js';

export function getLogMessages(logger: Logger): string[] {
  return logger
    .getRenderer()
    .getLogs()
    .map(({ message }) => message);
}
