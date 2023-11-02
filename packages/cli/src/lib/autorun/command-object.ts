import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { collectAndPersistReports, upload } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { CLI_NAME } from '../cli';
import { GeneralCliOptions } from '../implementation/model';

export function yargsAutorunCommandObject() {
  const command = 'autorun';
  return {
    command,
    describe: 'Shortcut for running collect followed by upload',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      console.log(chalk.bold(CLI_NAME));
      console.log(chalk.gray(`Run ${command}...`));
      const options = args as unknown as CoreConfig & GeneralCliOptions;
      await collectAndPersistReports(options);
      if (!options.upload) {
        console.warn('Upload skipped because configuration is not set.'); // @TODO log verbose
      } else {
        await upload(options);
      }
    },
  } satisfies CommandModule;
}
