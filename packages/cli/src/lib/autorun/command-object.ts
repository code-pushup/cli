import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { collectAndPersistReports, upload } from '@code-pushup/core';
import { ConfigMiddlewareOutput } from '../implementation/config-middleware';
import { uploadConfigSchema } from '@code-pushup/models';

export function yargsAutorunCommandObject() {
  return {
    command: 'autorun',
    describe: 'Autorun executes the collect and upload command after another',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const _args = args as unknown as ConfigMiddlewareOutput;
      const options = {
        ..._args,
        upload: uploadConfigSchema.parse(_args.upload),
      };
      await collectAndPersistReports(options);
      await upload(options);
    },
  } satisfies CommandModule;
}
