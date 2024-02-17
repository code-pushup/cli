import chalk from 'chalk';
import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { UploadOptions, upload } from '@code-pushup/core';
import { getLatestCommit, ui, validateCommitData } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import {
  renderIntegratePortalHint,
  uploadSuccessfulLog,
} from '../implementation/logging';

export function yargsUploadCommandObject() {
  const command = 'upload';
  return {
    command,
    describe: 'Upload report results to the portal',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      ui().logger.log(chalk.bold(CLI_NAME));
      ui().logger.info(chalk.gray(`Run ${command}...`));

      const options = args as unknown as UploadOptions;
      if (!options.upload) {
        renderIntegratePortalHint();
        throw new Error('Upload configuration not set');
      }
      const { url } = await upload(options);

      const commitData = await getLatestCommit();
      if (validateCommitData(commitData, { throwError: true })) {
        uploadSuccessfulLog(url);
      }
    },
  } satisfies CommandModule;
}
