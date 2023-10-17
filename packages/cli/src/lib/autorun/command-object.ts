import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { collectAndPersistReports, upload } from '@code-pushup/core';
import { CoreConfig, GlobalOptions } from '@code-pushup/models';

export function yargsAutorunCommandObject() {
  return {
    command: 'autorun',
    describe: 'Shortcut for running collect followed by upload',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const options = args as unknown as CoreConfig & GlobalOptions;
      await collectAndPersistReports(options);
      if (!options.upload) {
        console.warn('Upload skipped because configuration is not set.'); // @TODO log verbose
      } else {
        await upload(options);
      }
    },
  } satisfies CommandModule;
}
