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

        const result = diagnostics.reduce<
          Partial<Record<CodeRangeName, Pick<AuditOutput, 'slug' | 'details'>>>
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
        }, {});

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

        return expectedAudits.map(({ slug }): AuditOutput => {
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
        });
      },
      {
        ...profiler.measureConfig.tracks.pluginTypescript,
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
