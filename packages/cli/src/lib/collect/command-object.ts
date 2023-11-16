import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';
import { CLI_NAME } from '../cli';
import { onlyPluginsOption } from '../implementation/only-config-option';

export function yargsCollectCommandObject(): CommandModule {
  const command = 'collect';
  return {
    command,
    describe: 'Run Plugins and collect results',
    builder: {
      onlyPlugins: onlyPluginsOption,
    },
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const options = args as unknown as CollectAndPersistReportsOptions;
      console.log(chalk.bold(CLI_NAME));
      console.log(chalk.gray(`Run ${command}...`));
      await collectAndPersistReports(options);
    },
  } satisfies CommandModule;
}
