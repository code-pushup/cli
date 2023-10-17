import {ArgumentsCamelCase, CommandModule} from 'yargs';
import {upload} from '@code-pushup/core';
import {CommandBase} from '../implementation/model';

export function yargsUploadCommandObject() {
  return {
    command: 'upload',
    describe: 'Upload report results to the portal',
    handler: async <T>(args: ArgumentsCamelCase<T> & CommandBase) => {
      if (!args.upload) {
        throw new Error('Upload configuration not set');
      }
      await upload(args);
    },
  } satisfies CommandModule;
}
