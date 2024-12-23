import type { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import type { DocCoveragePluginConfig } from '../config.js';
import { processDocCoverage } from './doc-processer.js';
import type { DocumentationCoverageReport } from './models.js';

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
 * @param options - Configuration options specifying which audits to include and exclude
 * @returns Audit outputs with coverage scores and details about undocumented items
 */
export function trasformCoverageReportToAudits(
  coverageResult: DocumentationCoverageReport,
  options: Pick<DocCoveragePluginConfig, 'onlyAudits' | 'skipAudits'>,
): AuditOutputs {
  return Object.entries(coverageResult)
    .filter(([type]) => {
      const auditSlug = `${type}-coverage`;
      if (options.onlyAudits?.length) {
        return options.onlyAudits.includes(auditSlug);
      }
      if (options.skipAudits?.length) {
        return !options.skipAudits.includes(auditSlug);
      }
      return true;
    })
    .map(([type, item]) => {
      const { coverage } = item;

      return {
        slug: `${type}-coverage`,
        value: coverage,
        score: coverage / 100,
        displayValue: `${coverage} %`,
        details: {
          issues: item.issues.map(({ file, line }) => ({
            message: 'Missing documentation',
            source: { file, position: { startLine: line } },
            severity: 'warning',
          })),
        },
      };
    });
}
