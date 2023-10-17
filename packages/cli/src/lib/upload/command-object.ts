import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { upload } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';

export function yargsUploadCommandObject() {
  return {
    command: 'upload',
    describe: 'Upload report results to the portal',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const options = args as unknown as CoreConfig;
      if (!options.upload) {
        throw new Error('Upload configuration not set');
      }
      await upload(options);
    },
  } satisfies CommandModule;
}
