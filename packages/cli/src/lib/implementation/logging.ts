import { bold, gray } from 'ansis';
import { link, ui } from '@code-pushup/utils';

export function renderConfigureCategoriesHint(): void {
  ui().logger.info(
    gray(
      `💡 Configure categories to see the scores in an overview table. See: ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md',
      )}`,
    ),
  );
}
export function uploadSuccessfulLog(url: string): void {
  ui().logger.success('Upload successful!');
  ui().logger.success(link(url));
}

export function collectSuccessfulLog(): void {
  ui().logger.success('Collecting report successful!');
}

export function renderIntegratePortalHint(): void {
  ui()
    .sticker()
    .add(bold.gray('💡 Integrate the portal'))
    .add('')
    .add(
      `${gray('❯')} Upload a report to the server - ${gray(
        'npx code-pushup upload',
      )}`,
    )
    .add(
      `  ${link(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
      )}`,
    )
    .add(
      `${gray('❯')} ${gray('Portal Integration')} - ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    )
    .add(
      `${gray('❯')} ${gray('Upload Command')} - ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    )
    .render();
}
