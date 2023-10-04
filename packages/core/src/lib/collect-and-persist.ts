import { name, version } from '../../package.json';

import { pluginOutputSchema, Report } from '@code-pushup/models';
import { collect, CollectOptions } from './commands/collect';
import { logPersistedResults, persistReport } from './implementation/persist';

export async function collectAndPersistReports(
  config: CollectOptions,
): Promise<void> {
  const collectReport = await collect(config);
  const report: Report = {
    ...collectReport,
    packageName: name,
    version: version,
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
