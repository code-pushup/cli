import { collect, CollectOptions, persistReport } from '@quality-metrics/utils';
import { CommandModule } from 'yargs';

export function yargsCollectCommandObject() {
  const handler = async (
    config: CollectOptions & { format: string },
  ): Promise<void> => {
    const report = await collect(config);

    await persistReport(report, config);
  };

  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: handler as unknown as CommandModule['handler'],
  } satisfies CommandModule;
}
