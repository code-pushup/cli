import type { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import type { DocCoveragePluginConfig } from '../config';
import { processDocCoverage } from './doc-processer';
import type { CoverageResult, CoverageType } from './models';

export function createRunnerFunction(
  config: DocCoveragePluginConfig,
): RunnerFunction {
  return (): AuditOutputs => {
    const coverageResult = processDocCoverage(config);
    return trasformCoverageReportToAudits(coverageResult, config);
  };
}

/**
 * Transforms the coverage report into audit outputs.
 * @param coverageResult - The coverage result containing undocumented items and coverage statistics
 * @param options - Configuration options specifying which audits to include
 * @returns Audit outputs with coverage scores and details about undocumented items
 */
export function trasformCoverageReportToAudits(
  coverageResult: CoverageResult,
  options: Pick<DocCoveragePluginConfig, 'onlyAudits'>,
): AuditOutputs {
  return Object.entries(coverageResult)
    .filter(
      ([type]) =>
        !options.onlyAudits?.length ||
        options.onlyAudits.includes(`${type}-coverage`),
    )
    .map(([type, items]) => {
      const coverageType = type as CoverageType;
      const coverage = items.coverage;

      return {
        slug: `${coverageType}-coverage`,
        value: coverage,
        score: coverage / 100,
        displayValue: `${coverage} %`,
        details: {
          issues: items.issues.map(({ file, line }) => ({
            message: 'Missing documentation',
            source: { file, position: { startLine: line } },
            severity: 'warning',
          })),
        },
      };
    });
}
