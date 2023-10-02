import { pluginOutputSchema, Report } from '@quality-metrics/models';
import {
  collect,
  CollectOptions,
  CollectOutputError,
  persistReport,
  logPersistedResults,
} from '@quality-metrics-cli/core';
import { CommandModule } from 'yargs';
import * as packageJson from '../../../package.json';

export function yargsCollectCommandObject() {
  const handler = async (
    config: CollectOptions & { format: string },
  ): Promise<void> => {
    const collectReport = await collect(config);
    const report: Report = {
      ...collectReport,
      packageName: packageJson.name,
      version: packageJson.version,
    };

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
