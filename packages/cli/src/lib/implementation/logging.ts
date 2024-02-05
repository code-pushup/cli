import { Logger, cliui } from '@poppinss/cliui';
import chalk from 'chalk';
import { ArgumentsType } from 'vitest';
import { link } from '@code-pushup/utils';

type CliUi = ReturnType<typeof cliui>;
type CliUiOptions = ArgumentsType<typeof cliui>[number];

// eslint-disable-next-line import/no-mutable-exports,functional/no-let
export let singletonUiInstance: CliUi | undefined;
export function ui(options?: CliUiOptions): CliUi {
  if (singletonUiInstance === undefined) {
    singletonUiInstance = cliui(options);
  }
  return singletonUiInstance;
}

export function logger(): Logger {
  return ui().logger;
}

export function renderConfigureCategoriesHint(): void {
  logger().info(
    chalk.gray(
      `💡 Configure categories to see the scores in an overview table. See: ${link(
        'https://github.com/code-pushup/cli/blob/main/packages/cli/README.md',
      )}`,
    ),
  );
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
