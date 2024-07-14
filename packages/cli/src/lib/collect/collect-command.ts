import pc from 'picocolors';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';
import { link, ui } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import {
  collectSuccessfulLog,
  renderConfigureCategoriesHint,
} from '../implementation/logging';

export function yargsCollectCommandObject(): CommandModule {
  const command = 'collect';
  return {
    command,
    describe: 'Run Plugins and collect results',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const options = args as unknown as CollectAndPersistReportsOptions;
      ui().logger.log(pc.bold(CLI_NAME));
      ui().logger.info(pc.gray(`Run ${command}...`));

      await collectAndPersistReports(options);
      collectSuccessfulLog();

      if (options.categories.length === 0) {
        renderConfigureCategoriesHint();
      }

      const { upload = {} } = args as unknown as Record<
        'upload',
        object | undefined
      >;
      if (Object.keys(upload).length === 0) {
        renderUploadAutorunHint();
      }
    },
  } satisfies CommandModule;
}

export function renderUploadAutorunHint(): void {
  ui()
    .sticker()
    .add(pc.bold(pc.gray('💡 Visualize your reports')))
    .add('')
    .add(
      `${pc.gray('❯')} npx code-pushup upload - ${pc.gray(
        'Run upload to upload the created report to the server',
      )}`,
    )
    .add(
      `  ${link(
        'https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
      )}`,
    )
    .add(
      `${pc.gray('❯')} npx code-pushup autorun - ${pc.gray(
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
