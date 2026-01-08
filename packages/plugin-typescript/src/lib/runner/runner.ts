import type {
  AuditOutput,
  AuditOutputs,
  Issue,
  RunnerFunction,
} from '@code-pushup/models';
import {
  formatAsciiTable,
  logger,
  pluralizeToken,
  profiler,
  toSentenceCase,
} from '@code-pushup/utils';
import type { AuditSlug } from '../types.js';
import {
  type DiagnosticsOptions,
  getTypeScriptDiagnostics,
} from './ts-runner.js';
import type { CodeRangeName } from './types.js';
import { getIssueFromDiagnostic, tsCodeToAuditSlug } from './utils.js';

export type RunnerOptions = DiagnosticsOptions & {
  expectedAudits: { slug: AuditSlug }[];
};

export function createRunnerFunction(options: RunnerOptions): RunnerFunction {
  const { tsconfig, expectedAudits } = options;

  return (): Promise<AuditOutputs> =>
    profiler.measureAsync(
      'plugin-typescript:runner',
      async (): Promise<AuditOutputs> => {
        const diagnostics = getTypeScriptDiagnostics({ tsconfig });

        const result = profiler.measure(
          'plugin-typescript:diagnostic-processing',
          () =>
            diagnostics.reduce<
              Partial<
                Record<CodeRangeName, Pick<AuditOutput, 'slug' | 'details'>>
              >
            >((acc, diag) => {
              const slug = tsCodeToAuditSlug(diag.code);
              const existingIssues: Issue[] = acc[slug]?.details?.issues ?? [];
              return {
                ...acc,
                [slug]: {
                  slug,
                  details: {
                    issues: [...existingIssues, getIssueFromDiagnostic(diag)],
                  },
                },
              };
            }, {}),
          {
            ...profiler.measureConfig.tracks.pluginTypescript,
            color: 'tertiary',
            success: processedResult => ({
              properties: [
                ['Diagnostics Processed', String(diagnostics.length)],
                [
                  'Audit Categories',
                  String(Object.keys(processedResult).length),
                ],
                [
                  'Total Issues',
                  String(
                    Object.values(processedResult).reduce(
                      (sum, audit) =>
                        sum + (audit?.details?.issues?.length ?? 0),
                      0,
                    ),
                  ),
                ],
              ],
              tooltipText: `Processed ${diagnostics.length} TypeScript diagnostics into ${Object.keys(processedResult).length} audit categories`,
            }),
          },
        );

        logger.debug(
          formatAsciiTable(
            {
              columns: ['left', 'right'],
              rows: Object.values(result).map(audit => [
                `• ${toSentenceCase(audit.slug)}`,
                audit.details?.issues?.length ?? 0,
              ]),
            },
            { borderless: true },
          ),
        );

        return profiler.measure(
          'plugin-typescript:audit-aggregation',
          () =>
            expectedAudits.map(({ slug }): AuditOutput => {
              const { details } = result[slug] ?? {};

              const issues = details?.issues ?? [];
              return {
                slug,
                score: issues.length === 0 ? 1 : 0,
                value: issues.length,
                displayValue:
                  issues.length === 0
                    ? 'passed'
                    : pluralizeToken('error', issues.length),
                ...(issues.length > 0 ? { details } : {}),
              };
            }),
          {
            ...profiler.measureConfig.tracks.pluginTypescript,
            color: 'primary',
            success: (auditOutputs: AuditOutputs) => ({
              properties: [
                ['Expected Audits', String(expectedAudits.length)],
                ['Generated Audits', String(auditOutputs.length)],
                [
                  'Passed Audits',
                  String(
                    auditOutputs.filter(audit => audit.score === 1).length,
                  ),
                ],
                [
                  'Failed Audits',
                  String(auditOutputs.filter(audit => audit.score < 1).length),
                ],
                [
                  'Total Issues',
                  String(
                    auditOutputs.reduce((sum, audit) => sum + audit.value, 0),
                  ),
                ],
              ],
              tooltipText: `Aggregated ${auditOutputs.length} audits with ${auditOutputs.reduce((sum, audit) => sum + audit.value, 0)} total issues`,
            }),
          },
        );
      },
      {
        ...profiler.measureConfig.tracks.pluginTypescript,
        color: 'secondary',
        success: (result: AuditOutputs) => ({
          properties: [
            ['Expected Audits', String(expectedAudits.length)],
            ['Audits', String(result.length)],
            [
              'Passed',
              String(result.filter(audit => audit.score === 1).length),
            ],
            ['Failed', String(result.filter(audit => audit.score < 1).length)],
          ],
          tooltipText: `TypeScript diagnostics processed into ${result.length} audits`,
        }),
      },
    );
}
