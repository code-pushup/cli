import { CommandModule } from 'yargs';
import { upload } from '@code-pushup/core';

export function yargsUploadCommandObject() {
  return {
    command: 'upload',
    describe: 'Upload report results to the portal',
    handler: upload as unknown as CommandModule['handler'],
  } satisfies CommandModule;
}
