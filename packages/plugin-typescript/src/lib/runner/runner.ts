import type {
  AuditOutput,
  AuditOutputs,
  Issue,
  RunnerFunction,
} from '@code-pushup/models';
import { pluralizeToken } from '@code-pushup/utils';
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
  return async (): Promise<AuditOutputs> => {
    const diagnostics = await getTypeScriptDiagnostics({ tsconfig });
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
  };
}
