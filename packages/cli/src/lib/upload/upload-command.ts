import ansis from 'ansis';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { type UploadOptions, upload } from '@code-pushup/core';
import { logger } from '@code-pushup/utils';
import { CLI_NAME } from '../constants.js';
import {
  renderIntegratePortalHint,
  uploadSuccessfulLog,
} from '../implementation/logging.js';

export function yargsUploadCommandObject() {
  const command = 'upload';
  return {
    command,
    describe: 'Upload report results to the portal',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      logger.info(ansis.bold(CLI_NAME));
      logger.debug(`Running ${ansis.bold(command)} command`);

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
