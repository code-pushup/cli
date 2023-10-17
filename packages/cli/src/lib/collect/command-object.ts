import { ArgumentsCamelCase, CommandModule } from 'yargs';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';

export function yargsCollectCommandObject(): CommandModule {
  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const options = args as unknown as CollectAndPersistReportsOptions;
      await collectAndPersistReports(options);
    },
  } satisfies CommandModule;
}
