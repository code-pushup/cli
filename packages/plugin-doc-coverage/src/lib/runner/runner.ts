import type { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import type { DocCoveragePluginConfig } from '../config.js';
import { processDocCoverage } from './doc-processer.js';
import type { CoverageType, DocumentationCoverageReport } from './models.js';
import { coverageTypeToAuditSlug } from './utils.js';

export function createRunnerFunction(
  config: DocCoveragePluginConfig,
): RunnerFunction {
  return (): AuditOutputs => {
    const coverageResult = processDocCoverage(config);
    return trasformCoverageReportToAuditOutputs(coverageResult, config);
  };
}

/**
 * Transforms the coverage report into audit outputs.
 * @param coverageResult - The coverage result containing undocumented items and coverage statistics
 * @param options - Configuration options specifying which audits to include and exclude
 * @returns Audit outputs with coverage scores and details about undocumented items
 */
export function trasformCoverageReportToAuditOutputs(
  coverageResult: DocumentationCoverageReport,
  options: Pick<DocCoveragePluginConfig, 'onlyAudits' | 'skipAudits'>,
): AuditOutputs {
  return Object.entries(coverageResult)
    .filter(([type]) => {
      const auditSlug = coverageTypeToAuditSlug(type as CoverageType);
      if (options.onlyAudits?.length) {
        return options.onlyAudits.includes(auditSlug);
      }
      if (options.skipAudits?.length) {
        return !options.skipAudits.includes(auditSlug);
      }
      return true;
    })
    .map(([type, item]) => {
      const { coverage, issues } = item;

      return {
        slug: `${type}-coverage`,
        value: issues.length,
        score: coverage / 100,
        displayValue: `${issues.length} undocumented ${type}`,
        details: {
          issues: item.issues.map(({ file, line, name }) => ({
            message: `Missing ${type} documentation for ${name}`,
            source: { file, position: { startLine: line } },
            severity: 'warning',
          })),
        },
      };
    });
}
