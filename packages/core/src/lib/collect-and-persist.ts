import { Report, pluginReportSchema } from '@code-pushup/models';
import { name, version } from '../../package.json';
import { CollectOptions, collect } from './commands/collect';
import { logPersistedResults, persistReport } from './implementation/persist';

export async function collectAndPersistReports(
  config: CollectOptions,
): Promise<void> {
  const report: Report = {
    packageName: name,
    version,
    ...(await collect(config)),
  };

  const persistResults = await persistReport(report, config);
  logPersistedResults(persistResults);

  // validate report and throw if invalid
  report.plugins.forEach(plugin => {
    // Running checks after persisting helps while debugging as you can check the invalid output after the error is thrown
    pluginReportSchema.parse(plugin);
  });
}
