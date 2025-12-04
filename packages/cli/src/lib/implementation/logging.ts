import ansis from 'ansis';
import {
  formatAsciiLink,
  formatAsciiSticker,
  logger,
} from '@code-pushup/utils';

export function printCliCommand(command: string): void {
  logger.debug(`Running ${ansis.bold(command)} command\n`);
}

export function renderConfigureCategoriesHint(): void {
  logger.debug(
    `💡 Configure categories to see the scores in an overview table. See: ${formatAsciiLink(
      'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md',
    )}`,
    { force: true },
  );
}
export function uploadSuccessfulLog(url: string): void {
  logger.info(ansis.green('Upload successful!'));
  logger.info(formatAsciiLink(url));
}

export function collectSuccessfulLog(): void {
  logger.info(ansis.green('Collecting report successful!'));
}

export function renderIntegratePortalHint(): void {
  logger.info(
    formatAsciiSticker([
      ansis.bold.gray('💡 Integrate the portal'),
      '',
      `${ansis.gray('❯')} Upload a report to the server - ${ansis.gray(
        'npx code-pushup upload',
      )}`,
      `  ${formatAsciiLink(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
      )}`,
      `${ansis.gray('❯')} ${ansis.gray('Portal Integration')} - ${formatAsciiLink(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
      `${ansis.gray('❯')} ${ansis.gray('Upload Command')} - ${formatAsciiLink(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    ]),
  );
}
