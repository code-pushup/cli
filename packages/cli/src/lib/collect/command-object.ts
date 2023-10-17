import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { collectAndPersistReports } from '@code-pushup/core';
import { CommandBase } from '../implementation/model';

export function yargsCollectCommandObject(): CommandModule {
  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: async <T>(args: ArgumentsCamelCase<T> & CommandBase) => {
      await collectAndPersistReports(args);
    },
  };
}
