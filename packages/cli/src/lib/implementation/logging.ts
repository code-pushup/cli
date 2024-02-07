import chalk from 'chalk';
import { UploadConfig } from '@code-pushup/models';
import { link, portalCommitDashboardLink, ui } from '@code-pushup/utils';

export function renderConfigureCategoriesHint(): void {
  ui().logger.info(
    chalk.gray(
      `💡 Configure categories to see the scores in an overview table. See: ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md',
      )}`,
    ),
  );
}

export function uploadSuccessfulLog(
  options: UploadConfig,
  commit: string,
): void {
  ui().logger.success('Upload successful!');
  ui().logger.success(
    link(
      // @TODO extend config to maintain baseUrl under upload
      portalCommitDashboardLink(
        { ...options, baseUrl: '<YOUR_PORTAL_URL>' },
        commit,
      ),
    ),
  );
}

export function collectSuccessfulLog(): void {
  ui().logger.success('Collecting report successful!');
}

export function renderIntegratePortalHint(): void {
  ui()
    .sticker()
    .add(chalk.bold(chalk.gray('💡 Integrate the portal')))
    .add('')
    .add(
      `${chalk.gray('❯')} Upload a report to the server - ${chalk.gray(
        'npx code-pushup upload',
      )}`,
    )
    .add(
      `  ${link(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
      )}`,
    )
    .add(
      `${chalk.gray('❯')} ${chalk.gray('Portal Integration')} - ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    )
    .add(
      `${chalk.gray('❯')} ${chalk.gray('Upload Command')} - ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    )
    .render();
}
