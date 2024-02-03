import { cliui } from '@poppinss/cliui';
import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';
import { link } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { renderConfigureCategoriesHint } from '../implementation/logging';
import { yargsOnlyPluginsOptionsDefinition } from '../implementation/only-plugins.options';

export function yargsCollectCommandObject(): CommandModule {
  const command = 'collect';
  return {
    command,
    describe: 'Run Plugins and collect results',
    builder: yargsOnlyPluginsOptionsDefinition(),
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const options = args as unknown as CollectAndPersistReportsOptions;
      const ui = cliui();
      const logger = ui.logger;
      logger.log(chalk.bold(CLI_NAME));
      logger.info(chalk.gray(`Run ${command}...`));
      await collectAndPersistReports(options);

      if (options.categories.length === 0) {
        renderConfigureCategoriesHint(ui);
      }

      const { upload = {} } = args as unknown as Record<
        'upload',
        object | undefined
      >;
      if (Object.keys(upload).length === 0) {
        renderUploadAutorunHint(ui);
      }
    },
  } satisfies CommandModule;
}

export function renderUploadAutorunHint(ui: ReturnType<typeof cliui>): void {
  ui.sticker()
    .add(chalk.bold(chalk.gray('💡 Visualize your reports')))
    .add('')
    .add(
      `${chalk.gray('❯')} npx code-pushup upload - ${chalk.gray(
        'Run upload to upload the created report to the server',
      )}`,
    )
    .add(
      `  ${link(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
      )}`,
    )
    .add(
      `${chalk.gray('❯')} npx code-pushup autorun - ${chalk.gray(
        'Run collect & upload',
      )}`,
    )
    .add(
      `  ${link(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#autorun-command',
      )}`,
    )
    .render();
}
