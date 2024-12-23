import { DiagnosticCategory } from 'typescript';
import type {
  AuditOutput,
  AuditOutputs,
  AuditReport,
  Issue,
  RunnerFunction,
} from '@code-pushup/models';
import type { AuditSlug } from '../types.js';
import type { TypescriptPluginOptions } from '../typescript-plugin.js';
import { getDiagnostics } from './typescript-runner.js';
import {
  getIssueFromDiagnostic,
  transformTSErrorCodeToAuditSlug,
} from './utils.js';

export function createRunnerFunction(
  options: TypescriptPluginOptions,
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const diagnostics = await getDiagnostics(options);

    const result: Record<
      AuditSlug,
      Pick<AuditReport, 'slug' | 'details'>
    > = diagnostics
      .filter(
        ({ category }) =>
          category === DiagnosticCategory.Warning ||
          category === DiagnosticCategory.Error,
      )
      .reduce(
        (acc, diag) => {
          const slug = transformTSErrorCodeToAuditSlug(diag.code);
          const issue = getIssueFromDiagnostic(diag);

          const existingIssues: Issue[] =
            (acc[slug] && acc[slug].details?.issues) || ([] as Issue[]);

          return {
            ...acc,
            [slug]: {
              slug,
              details: {
                issues: [...existingIssues, issue],
              },
            },
          };
        },
        {} as unknown as Record<
          AuditSlug,
          Pick<AuditReport, 'slug' | 'details'>
        >,
      );

    return Object.values(result).map(({ slug, details }) => {
      const issues = details?.issues ?? [];
      return {
        slug,
        score: issues.length === 0 ? 1 : 0,
        value: issues.length,
        ...(issues.length > 0 ? { details } : {}),
      } satisfies AuditOutput;
    });
  };
}
