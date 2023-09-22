import {collect, CollectOptions, CollectOutputError, persistReport, logPersistedResults} from '@quality-metrics/utils';
import {CommandModule} from 'yargs';
import {pluginOutputSchema} from '@quality-metrics/models';

export function yargsCollectCommandObject() {
  const handler = async (
    config: CollectOptions & { format: string },
  ): Promise<void> => {
    const report = await collect(config);

    const persistResults = await persistReport(report, config);

    logPersistedResults(persistResults);

    // validate report
    report.plugins.forEach(plugin => {
      try {
        // Running checks after persisting helps while debugging as you can check the invalid output after the error
        pluginOutputSchema.parse(plugin);
      } catch (e) {
        throw new CollectOutputError(plugin.slug, e as Error);
      }
    });
  };

  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: handler as unknown as CommandModule['handler'],
  } satisfies CommandModule;
}
