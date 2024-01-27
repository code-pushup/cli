import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';
import { CLI_NAME } from '../constants';
import { yargsOnlyPluginsOptionsDefinition } from '../implementation/only-plugins.options';

export function yargsCollectCommandObject(): CommandModule {
  const command = 'collect';
  return {
    command,
    describe: 'Run Plugins and collect results',
    builder: yargsOnlyPluginsOptionsDefinition(),
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const options = args as unknown as CollectAndPersistReportsOptions;
      console.info(chalk.bold(CLI_NAME));
      console.info(chalk.gray(`Run ${command}...`));
      await collectAndPersistReports(options);
      const { upload = {} } = args as unknown as Record<
        'upload',
        object | undefined
      >;
      if (Object.keys(upload).length === 0) {
        console.info(`
        💡 Visualize your reports:
        - npx code-pushup upload - Run upload to upload the created report to the server
          https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command
        - npx code-pushup autorun - Run collect & upload
          https://github.com/code-pushup/cli/tree/main/packages/cli#autorun-command
        `);
      }
    },
  } satisfies CommandModule;
}
