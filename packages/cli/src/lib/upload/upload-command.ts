import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { UploadOptions, upload } from '@code-pushup/core';
import { CLI_NAME } from '../constants';

export function yargsUploadCommandObject() {
  const command = 'upload';
  return {
    command,
    describe: 'Upload report results to the portal',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      console.info(chalk.bold(CLI_NAME));
      console.info(chalk.gray(`Run ${command}...`));

      const options = args as unknown as UploadOptions;
      if (!options.upload) {
        console.info(
          [
            '💡 Integrate the portal:',
            '- npx code-pushup upload - Run upload to upload the created report to the server',
            '  https://github.com/code-pushup/cli/tree/main/packages/cli#upload-command',
            '- Portal Integration - https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
            '- Upload Command - https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#portal-integration',
          ].join('\n'),
        );
        throw new Error('Upload configuration not set');
      }
      await upload(options);
    },
  } satisfies CommandModule;
}
