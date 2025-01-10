import type {
  AuditOutput,
  AuditOutputs,
  AuditReport,
  Issue,
  RunnerFunction,
} from '@code-pushup/models';
import type { AuditSlug } from '../types.js';
import {
  type DiagnosticsOptions,
  getTypeScriptDiagnostics,
} from './ts-runner.js';
import type { CodeRangeName } from './types.js';
import { getIssueFromDiagnostic, tSCodeToAuditSlug } from './utils.js';

export type RunnerOptions = DiagnosticsOptions & {
  expectedAudits: { slug: AuditSlug }[];
};

export function createRunnerFunction(options: RunnerOptions): RunnerFunction {
  const { tsconfig, expectedAudits } = options;
  return async (): Promise<AuditOutputs> => {
    const diagnostics = await getTypeScriptDiagnostics({ tsconfig });
    const result: Record<
      CodeRangeName,
      Pick<AuditReport, 'slug' | 'details'>
    > = diagnostics.reduce(
      (acc, diag) => {
        const slug = tSCodeToAuditSlug(diag.code);
        const existingIssues: Issue[] =
          (acc[slug] && acc[slug].details?.issues) || ([] as Issue[]);
        return {
          ...acc,
          [slug]: {
            slug,
            details: {
              issues: [...existingIssues, getIssueFromDiagnostic(diag)],
            },
          },
        };
      },
      {} as unknown as Record<
        CodeRangeName,
        Pick<AuditOutput, 'slug' | 'details'>
      >,
    );

    return expectedAudits.map(({ slug }) => {
      const { details } = result[slug as CodeRangeName] ?? {};

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
