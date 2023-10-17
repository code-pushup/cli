import {
  CoreConfig,
  GlobalOptions,
  pluginReportSchema,
} from '@code-pushup/models';
import { verboseUtils } from '@code-pushup/utils';
import { collect } from './commands/collect';
import { logPersistedResults, persistReport } from './implementation/persist';

export type CollectAndPersistReportsOptions = Pick<
  CoreConfig,
  'persist' | 'plugins' | 'categories'
> &
  GlobalOptions;

export async function collectAndPersistReports(
  options: CollectAndPersistReportsOptions,
): Promise<void> {
  const { exec } = verboseUtils(options.verbose);
  const report = await collect(options);

  const persistResults = await persistReport(report, options);
  exec(() => logPersistedResults(persistResults));

  // validate report and throw if invalid
  report.plugins.forEach(plugin => {
    // Running checks after persisting helps while debugging as you can check the invalid output after the error is thrown
    pluginReportSchema.parse(plugin);
  });
}
