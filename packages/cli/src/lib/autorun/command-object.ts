import {ArgumentsCamelCase, CommandModule} from 'yargs';
import {collectAndPersistReports, upload} from '@code-pushup/core';
import {CommandBase} from '../implementation/model';

export function yargsAutorunCommandObject() {
  return {
    command: 'autorun',
    describe: 'Shortcut for running collect followed by upload',
    handler: async <T>(args: ArgumentsCamelCase<T> & CommandBase) => {
      await collectAndPersistReports(args);
      if (!args.upload) {
        console.warn('Upload skipped because configuration is not set.'); // @TODO log verbose
      } else {
        await upload(args);
      }
    },
  } satisfies CommandModule;
}
