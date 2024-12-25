import { DiagnosticCategory } from 'typescript';
import type {
  Audit,
  AuditOutput,
  AuditOutputs,
  AuditReport,
  Issue,
  RunnerFunction,
} from '@code-pushup/models';
import type { TypescriptPluginOptions } from '../config.js';
import { AUDITS } from '../constants.js';
import type { AuditSlug } from '../types.js';
import { filterAuditsBySlug } from '../utils.js';
import { getDiagnostics } from './typescript-runner.js';
import {
  AUDIT_LOOKUP,
  getIssueFromDiagnostic,
  transformTSErrorCodeToAuditSlug,
} from './utils.js';

export function createRunnerFunction(
  options: TypescriptPluginOptions & { audits: Audit[] },
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
      // filter out unsupported errors
      .filter(({ code }) => AUDIT_LOOKUP.get(code) !== undefined)
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

    return AUDITS.filter(filterAuditsBySlug(options.onlyAudits)).map(audit => {
      const { details } = result[audit.slug as AuditSlug] ?? {};
      const issues = details?.issues ?? [];
      return {
        ...audit,
        score: issues.length === 0 ? 1 : 0,
        value: issues.length,
        ...(issues.length > 0 ? { details } : {}),
      } satisfies AuditOutput;
    });
  };
}
