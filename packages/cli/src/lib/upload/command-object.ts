import { CommandModule } from 'yargs';
import { upload } from '@code-pushup/core';

export function yargsUploadCommandObject() {
  return {
    command: 'upload',
    describe: 'Upload report results to the portal',
    handler: parsedProcessArgs => {
      upload(parsedProcessArgs as any).then(() =>
        console.log('Upload Succeeded!'),
      );
    },
  } satisfies CommandModule;
}
