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
  return await profiler.measureAsync(
    'core:collect-and-persist-reports',
    async () => {
      const reportResult = await profiler.measureAsync(
        'core:collect',
        () => collect(options),
        {
          color: 'primary',
          success: (reportResult: Awaited<ReturnType<typeof collect>>) => ({
            properties: [['Plugins', String(reportResult.length)]],
            tooltipText: `Collected reports from ${reportResult.length} plugin(s)`,
          }),
        },
      );

      const sortedScoredReport = profiler.measure(
        'core:score-report',
        () => {
          const scoredReport = scoreReport(reportResult);
          return sortReport(scoredReport);
        },
        {
          color: 'primary',
          success: (sortedScoredReport: ReturnType<typeof sortReport>) => {
            const totalAudits = sortedScoredReport.plugins.reduce(
              (sum, plugin) => sum + plugin.audits.length,
              0,
            );
            const totalGroups = sortedScoredReport.plugins.reduce(
              (sum, plugin) => sum + (plugin.groups?.length || 0),
              0,
            );
            return {
              properties: [
                [
                  'Categories',
                  String(sortedScoredReport.categories?.length || 0),
                ],
                ['Plugins', String(sortedScoredReport.plugins.length)],
                ['Total Audits', String(totalAudits)],
                ['Total Groups', String(totalGroups)],
              ],
              tooltipText: `Scored and sorted report with ${totalAudits} audits across ${sortedScoredReport.plugins.length} plugins`,
            };
          },
        },
      );

      const { persist } = options;
      const { skipReports = false, ...persistOptions } = persist ?? {};

      if (skipReports) {
        logger.info('Skipped saving report as persist.skipReports flag is set');
      } else {
        const reportFiles = await profiler.measureAsync(
          'core:persist-reports',
          () => persistReport(reportResult, sortedScoredReport, persistOptions),
          {
            color: 'primary',
            success: (
              reportFiles: Awaited<ReturnType<typeof persistReport>>,
            ) => ({
              properties: [
                ['Output Files', String(reportFiles.length)],
                ['Output Paths', reportFiles.join(', ')],
              ],
              tooltipText: `Persisted ${reportFiles.length} report file(s)`,
            }),
          },
        );
        logPersistedReport(reportFiles);
      }

      // terminal output
      logger.newline();
      logger.newline();
      logStdoutSummary(sortedScoredReport);
      logger.newline();
      logger.newline();
    },
    {
      color: 'primary',
    },
  );
}
