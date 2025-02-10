import {
  type CoreConfig,
  type PersistConfig,
  pluginReportSchema,
} from '@code-pushup/models';
import {
  logStdoutSummary,
  scoreReport,
  sortReport,
  verboseUtils,
} from '@code-pushup/utils';
import { collect } from './implementation/collect.js';
import {
  logPersistedResults,
  persistReport,
} from './implementation/persist.js';
import type { GlobalOptions } from './types.js';

export type CollectAndPersistReportsOptions = Pick<
  CoreConfig,
  'plugins' | 'categories'
> & { persist: Required<PersistConfig> } & Partial<GlobalOptions>;

export async function collectAndPersistReports(
  options: CollectAndPersistReportsOptions,
): Promise<void> {
  const { exec } = verboseUtils(options.verbose);

  const report = await collect(options);
  const sortedScoredReport = sortReport(scoreReport(report));

  const persistResults = await persistReport(
    report,
    sortedScoredReport,
    options.persist,
  );

  // terminal output
  logStdoutSummary(sortedScoredReport, options.verbose);

  exec(() => {
    logPersistedResults(persistResults);
  });

  // validate report and throw if invalid
  report.plugins.forEach(plugin => {
    // Running checks after persisting helps while debugging as you can check the invalid output after the error is thrown
    pluginReportSchema.parse(plugin);
  });
}
