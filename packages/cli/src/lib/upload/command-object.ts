import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { upload } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { CLI_NAME } from '../cli';

export function yargsUploadCommandObject() {
  const command = 'autorun';
  return {
    command,
    describe: 'Upload report results to the portal',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      console.log(chalk.bold(CLI_NAME));
      console.log(chalk.gray(`Run ${command}...`));

      const options = args as unknown as CoreConfig;
      if (!options.upload) {
        throw new Error('Upload configuration not set');
      }
      await upload(options);
    },
  } satisfies CommandModule;
}
