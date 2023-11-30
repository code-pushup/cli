import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectOptions,
  UploadOptions,
  collectAndPersistReports,
  upload,
} from '@code-pushup/core';
import { CLI_NAME } from '../cli';
import { onlyPluginsOption } from '../implementation/only-plugins-options';

type AutorunOptions = CollectOptions & UploadOptions;

export function yargsAutorunCommandObject() {
  const command = 'autorun';
  return {
    command,
    describe: 'Shortcut for running collect followed by upload',
    builder: {
      onlyPlugins: onlyPluginsOption,
    },
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      console.info(chalk.bold(CLI_NAME));
      console.info(chalk.gray(`Run ${command}...`));
      const options = args as unknown as AutorunOptions;
      await collectAndPersistReports(options);
      if (!options.upload) {
        console.warn('Upload skipped because configuration is not set.'); // @TODO log verbose
      } else {
        await upload(options);
      }
    },
  } satisfies CommandModule;
}
