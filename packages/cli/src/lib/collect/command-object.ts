import { ArgumentsCamelCase, CommandModule } from 'yargs';
import { collectAndPersistReports } from '@code-pushup/core';
import { ConfigMiddlewareOutput } from '../implementation/config-middleware';

export function yargsCollectCommandObject(): CommandModule {
  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: async <T>(args: ArgumentsCamelCase<T>) => {
      const _args = args as unknown as ConfigMiddlewareOutput;
      await collectAndPersistReports(_args);
    },
  };
}
