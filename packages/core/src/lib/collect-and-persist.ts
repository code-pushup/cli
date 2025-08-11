import {
  type CoreConfig,
  type PersistConfig,
  pluginReportSchema,
} from '@code-pushup/models';
import {
  isVerbose,
  logStdoutSummary,
  scoreReport,
  sortReport,
  ui,
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
> & {
  persist: Required<Omit<PersistConfig, 'skipReports'>> &
    Pick<PersistConfig, 'skipReports'>;
} & Partial<GlobalOptions>;

export async function collectAndPersistReports(
  options: CollectAndPersistReportsOptions,
): Promise<void> {
  const logger = ui().logger;
  const reportResult = await collect(options);
  const sortedScoredReport = sortReport(scoreReport(reportResult));

  const { persist } = options;
  const { skipReports = false, ...persistOptions } = persist ?? {};

  if (skipReports !== true) {
    const persistResults = await persistReport(
      reportResult,
      sortedScoredReport,
      persistOptions,
    );

    if (isVerbose()) {
      logPersistedResults(persistResults);
    }
  } else {
    logger.info('Skipping saving reports as `persist.skipReports` is true');
  }

  // terminal output
  logStdoutSummary(sortedScoredReport);

  // validate report and throw if invalid
  reportResult.plugins.forEach(plugin => {
    // Running checks after persisting helps while debugging as you can check the invalid output after the error is thrown
    pluginReportSchema.parse(plugin);
  });
}
