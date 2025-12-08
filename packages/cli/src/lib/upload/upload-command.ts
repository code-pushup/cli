import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { type UploadOptions, upload } from '@code-pushup/core';
import { logger } from '@code-pushup/utils';
import {
  printCliCommand,
  renderPortalHint,
} from '../implementation/logging.js';

export function yargsUploadCommandObject() {
  const command = 'upload';
  return {
    command,
    describe: 'Upload report results to the portal',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      printCliCommand(command);

      const options = args as unknown as UploadOptions;
      if (options.upload == null) {
        logger.newline();
        renderPortalHint();
        logger.newline();
        throw new Error('Upload to Portal is missing configuration');
      }
      await upload(options);
    },
  } satisfies CommandModule;
}
