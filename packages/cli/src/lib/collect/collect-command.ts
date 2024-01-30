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
      if (options.categories.length === 0) {
        console.info(
          chalk.gray(
            '💡 Configure categories to see the scores in an overview table. See: https://github.com/code-pushup/cli/blob/main/packages/cli/README.md',
          ),
        );
      }
    },
  } satisfies CommandModule;
}
