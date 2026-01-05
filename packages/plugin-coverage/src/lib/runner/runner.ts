import type { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import {
  executeProcess,
  formatAsciiTable,
  logger,
  pluralizeToken,
} from '@code-pushup/utils';
import type { FinalCoveragePluginConfig } from '../config.js';
import { slugToTitle } from '../format.js';
import { lcovResultsToAuditOutputs } from './lcov/lcov-runner.js';

export function createRunnerFunction(
  config: FinalCoveragePluginConfig,
): RunnerFunction {
  return (): Promise<AuditOutputs> =>
    profiler.measureAsync(
      'plugin-coverage:runner',
      async (): Promise<AuditOutputs> => {
        const {
          reports,
          coverageToolCommand,
          continueOnCommandFail,
          coverageTypes,
        } = config;

        // Run coverage tool if provided
        if (coverageToolCommand == null) {
          logger.info(
            'No test command provided, assuming coverage has already been collected',
          );
        } else {
          logger.info('Executing test command to collect coverage ...');
          const { command, args } = coverageToolCommand;
          try {
            await executeProcess({ command, args });
          } catch {
            if (!continueOnCommandFail) {
              throw new Error(
                'Running coverage tool failed. Make sure all your tests are passing.',
              );
            }
          }
        }

        // Calculate coverage from LCOV results
        const auditOutputs = await lcovResultsToAuditOutputs(
          reports,
          coverageTypes,
        );

        logAuditOutputs(auditOutputs);

        return auditOutputs;
      },
      {
        ...profiler.measureConfig.tracks.pluginCoverage,
        success: (result: AuditOutputs) => ({
          properties: [
            ['Reports', String(reports.length)],
            ['Audits', String(result.length)],
            ['Coverage Types', String(coverageTypes.length)],
            ['Command Executed', coverageToolCommand ? 'true' : 'false'],
          ],
          tooltipText: `Processed ${reports.length} coverage reports into ${result.length} audits`,
        }),
      },
    );
}

function logAuditOutputs(auditOutputs: AuditOutputs): void {
  logger.info(
    `Transformed LCOV reports to ${pluralizeToken('audit output', auditOutputs.length)}`,
  );
  logger.info(
    formatAsciiTable(
      {
        columns: ['left', 'right'],
        rows: auditOutputs.map(audit => [
          `• ${slugToTitle(audit.slug)}`,
          `${audit.value.toFixed(2)}%`,
        ]),
      },
      { borderless: true },
    ),
  );
}
