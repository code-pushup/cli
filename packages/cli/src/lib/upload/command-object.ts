import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { upload } from '@code-pushup/core';
import { uploadConfigSchema } from '@code-pushup/models';
import { CommandBase } from '../implementation/model';

export function yargsUploadCommandObject() {
  return {
    command: 'upload',
    describe: 'Upload report results to the portal',
    handler: async <T>(args: ArgumentsCamelCase<T> & CommandBase) => {
      const _args = args;
      const uploadOptions = {
        ..._args,
        upload: uploadConfigSchema.parse(_args.upload),
      };
      await upload(uploadOptions);
    },
  } satisfies CommandModule;
}
