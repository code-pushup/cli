import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { collectAndPersistReports, upload } from '@code-pushup/core';
import { uploadConfigSchema } from '@code-pushup/models';
import { CommandBase } from '../implementation/model';

export function yargsAutorunCommandObject() {
  return {
    command: 'autorun',
    describe: 'Shortcut for running collect followed by upload',
    handler: async <T>(args: ArgumentsCamelCase<T> & CommandBase) => {
      const options = {
        ...args,
        upload: uploadConfigSchema.parse(args.upload),
      };
      await collectAndPersistReports(options);
      await upload(options);
    },
  } satisfies CommandModule;
}
