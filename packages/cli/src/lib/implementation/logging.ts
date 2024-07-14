import pc from 'picocolors';
import { link, ui } from '@code-pushup/utils';

export function renderConfigureCategoriesHint(): void {
  ui().logger.info(
    pc.gray(
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
    .add(pc.bold(pc.gray('💡 Integrate the portal')))
    .add('')
    .add(
      `${pc.gray('❯')} Upload a report to the server - ${pc.gray(
        'npx code-pushup upload',
      )}`,
    )
    .add(
      `  ${link(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
      )}`,
    )
    .add(
      `${pc.gray('❯')} ${pc.gray('Portal Integration')} - ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    )
    .add(
      `${pc.gray('❯')} ${pc.gray('Upload Command')} - ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
      )}`,
    )
    .render();
}
