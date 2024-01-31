import { CoreConfig, pluginReportSchema } from '@code-pushup/models';
import { verboseUtils } from '@code-pushup/utils';
import { collect } from './implementation/collect';
import { logPersistedResults, persistReport } from './implementation/persist';
import { normalizePersistConfig } from './normalize';
import { GlobalOptions } from './types';

export type CollectAndPersistReportsOptions = Required<
  Pick<CoreConfig, 'persist' | 'plugins' | 'categories'>
> &
  GlobalOptions;

export async function collectAndPersistReports(
  options: CollectAndPersistReportsOptions,
): Promise<void> {
  const { exec } = verboseUtils(options.verbose);

  const report = await collect(options);

  const persist = normalizePersistConfig(options.persist);
  const persistResults = await persistReport(report, persist);
  exec(() => {
    logPersistedResults(persistResults);
  });

  // validate report and throw if invalid
  report.plugins.forEach(plugin => {
    // Running checks after persisting helps while debugging as you can check the invalid output after the error is thrown
    pluginReportSchema.parse(plugin);
  });
}
