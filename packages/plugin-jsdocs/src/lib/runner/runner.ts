import type { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import {
  type FileCoverage,
  filesCoverageToTree,
  getGitRoot,
  objectToEntries,
  profiler,
  toNumberPrecision,
} from '@code-pushup/utils';
import type { JsDocsPluginTransformedConfig } from '../config.js';
import { processJsDocs } from './doc-processor.js';
import type { CoverageType } from './models.js';
import { coverageTypeToAuditSlug } from './utils.js';

export function createRunnerFunction(
  config: JsDocsPluginTransformedConfig,
): RunnerFunction {
  return (): Promise<AuditOutputs> =>
    profiler.measureAsync(
      'plugin-jsdocs:runner',
      async (): Promise<AuditOutputs> => {
        const coverageResult = processJsDocs(config);
        const gitRoot = await getGitRoot();
        return trasformCoverageReportToAuditOutputs(
          coverageResult,
          config,
          gitRoot,
        );
      },
      {
        ...profiler.measureConfig.tracks.pluginJsDocs,
        success: (result: AuditOutputs) => ({
          properties: [
            ['Audits', String(result.length)],
            [
              'Total Undocumented',
              String(result.reduce((sum, audit) => sum + audit.value, 0)),
            ],
            ['Coverage Types', String(Object.keys(result).length)],
          ],
          tooltipText: `JSDocs coverage analysis completed with ${result.length} audits`,
        }),
      },
    );
}

/**
 * Transforms the coverage report into audit outputs.
 * @param coverageResult - The coverage result containing undocumented items and coverage statistics
 * @param options - Configuration options specifying which audits to include and exclude
 * @param gitRoot - Root directory in repo for relative file paths
 * @returns Audit outputs with coverage scores and details about undocumented items
 */
export function trasformCoverageReportToAuditOutputs(
  coverageResult: Record<CoverageType, FileCoverage[]>,
  options: Pick<JsDocsPluginTransformedConfig, 'onlyAudits' | 'skipAudits'>,
  gitRoot: string,
): AuditOutputs {
  return objectToEntries(coverageResult)
    .filter(([type]) => {
      const auditSlug = coverageTypeToAuditSlug(type);
      if (options.onlyAudits?.length) {
        return options.onlyAudits.includes(auditSlug);
      }
      if (options.skipAudits?.length) {
        return !options.skipAudits.includes(auditSlug);
      }
      return true;
    })
    .map(([type, files]) => {
      const tree = filesCoverageToTree(files, gitRoot, `Documented ${type}`);
      const coverage = tree.root.values.coverage;
      const missingCount = files.reduce(
        (acc, file) => acc + file.missing.length,
        0,
      );
      const MAX_DECIMAL_PLACES = 4;

      return {
        slug: `${type}-coverage`,
        value: missingCount,
        score: toNumberPrecision(coverage, MAX_DECIMAL_PLACES),
        displayValue: `${missingCount} undocumented ${type}`,
        details: {
          trees: [tree],
        },
      };
    });
}
