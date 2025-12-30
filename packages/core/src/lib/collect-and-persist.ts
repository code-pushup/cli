import type {
  CacheConfigObject,
  CoreConfig,
  PersistConfig,
} from '@code-pushup/models';
import {
  logStdoutSummary,
  logger,
  profiler,
  scoreReport,
  sortReport,
} from '@code-pushup/utils';
import { collect } from './implementation/collect.js';
import { logPersistedReport, persistReport } from './implementation/persist.js';

export type CollectAndPersistReportsOptions = Pick<
  CoreConfig,
  'plugins' | 'categories'
> & {
  persist: Required<Omit<PersistConfig, 'skipReports'>> &
    Pick<PersistConfig, 'skipReports'>;
  cache: CacheConfigObject;
};

export async function collectAndPersistReports(
  options: CollectAndPersistReportsOptions,
): Promise<void> {
  return profiler.spanAsync(
    'collectAndPersistReports',
    async () => {
      const reportResult = await collect(options);
      const sortedScoredReport = sortReport(scoreReport(reportResult));

      const { persist } = options;
      const { skipReports = false, ...persistOptions } = persist ?? {};

      if (skipReports) {
        logger.info('Skipped saving report as persist.skipReports flag is set');
      } else {
        const reportFiles = await persistReport(
          reportResult,
          sortedScoredReport,
          persistOptions,
        );

        await profiler.span(
          'persistLogit',
          () => logPersistedReport(reportFiles),
          { detail: profiler.tracks.cli() },
        );
      }

      // terminal output
      logger.newline();
      logger.newline();
      logStdoutSummary(sortedScoredReport);
      logger.newline();
      logger.newline();
    },
    { detail: profiler.tracks.cli() },
  );
}
