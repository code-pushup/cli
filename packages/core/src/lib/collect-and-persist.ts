import { CoreConfig, pluginReportSchema } from '@code-pushup/models';
import { collect } from './commands/collect';
import { logPersistedResults, persistReport } from './implementation/persist';

export type CollectAndPersistReportsOptions = Pick<
  CoreConfig,
  'persist' | 'plugins' | 'categories'
>;

export async function collectAndPersistReports(
  config: CollectAndPersistReportsOptions,
): Promise<void> {
  const report = await collect(config);

  const persistResults = await persistReport(report, config);
  logPersistedResults(persistResults);

  // validate report and throw if invalid
  report.plugins.forEach(plugin => {
    // Running checks after persisting helps while debugging as you can check the invalid output after the error is thrown
    pluginReportSchema.parse(plugin);
  });
}
