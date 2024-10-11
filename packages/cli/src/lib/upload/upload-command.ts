import { bold, gray } from 'ansis';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { type UploadOptions, upload } from '@code-pushup/core';
import { ui } from '@code-pushup/utils';
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
      ui().logger.log(bold(CLI_NAME));
      ui().logger.info(gray(`Run ${command}...`));

      const options = args as unknown as UploadOptions;
      if (options.upload == null) {
        renderIntegratePortalHint();
        throw new Error('Upload configuration not set');
      }
      const report = await upload(options);
      if (report?.url) {
        uploadSuccessfulLog(report.url);
      }
    },
  } satisfies CommandModule;
}
