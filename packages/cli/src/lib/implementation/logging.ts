import ansis from 'ansis';
import { formatAsciiLink, logger, ui } from '@code-pushup/utils';

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
  // TODO: replace @poppinss/cliui
  ui()
    .sticker()
    .add(ansis.bold.gray('💡 Integrate the portal'))
    .add('')
    .add(
      `${ansis.gray('❯')} Upload a report to the server - ${ansis.gray(
        'npx code-pushup upload',
      )}`,
    )
    .add(
      `  ${formatAsciiLink(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
      )}`,
    )
    .add(
      `${ansis.gray('❯')} ${ansis.gray('Portal Integration')} - ${formatAsciiLink(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    )
    .add(
      `${ansis.gray('❯')} ${ansis.gray('Upload Command')} - ${formatAsciiLink(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    )
    .render();
}
