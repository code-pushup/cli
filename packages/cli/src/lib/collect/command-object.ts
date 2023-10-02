import { CommandModule } from 'yargs';
import { collectAndPersistReports } from '../implementation/collect-and-persist';

export function yargsCollectCommandObject() {
  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: collectAndPersistReports as unknown as CommandModule['handler'],
  } satisfies CommandModule;
}
