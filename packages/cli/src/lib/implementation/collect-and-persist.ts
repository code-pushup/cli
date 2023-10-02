import {
  collect,
  CollectOptions,
  logPersistedResults,
  persistReport,
} from '@quality-metrics/core';
import { pluginOutputSchema, Report } from '@quality-metrics/models';
import * as packageJson from '../../../package.json';

// @TODO [73] move into core
export async function collectAndPersistReports(
  config: CollectOptions,
): Promise<void> {
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
      throw new Error(`${plugin.slug} - ${(e as Error).message}`);
    }
  });
}
