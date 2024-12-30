import type {
  Audit,
  AuditOutput,
  AuditOutputs,
  AuditReport,
  Issue,
  RunnerFunction,
} from '@code-pushup/models';
import { AUDIT_LOOKUP } from './constants.js';
import {
  type DiagnosticsOptions,
  getTypeScriptDiagnostics,
} from './ts-runner.js';
import type { CompilerOptionName } from './types.js';
import { getIssueFromDiagnostic, tSCodeToAuditSlug } from './utils.js';

export type RunnerOptions = DiagnosticsOptions & {
  expectedAudits: Pick<Audit, 'slug'>[];
};

export function createRunnerFunction(options: RunnerOptions): RunnerFunction {
  const { tsConfigPath, expectedAudits } = options;
  return async (): Promise<AuditOutputs> => {
    const diagnostics = await getTypeScriptDiagnostics({ tsConfigPath });
    const result: Record<
      CompilerOptionName,
      Pick<AuditReport, 'slug' | 'details'>
    > = diagnostics
      // filter out unsupported errors
      .filter(({ code }) => AUDIT_LOOKUP.get(code) !== undefined)
      .reduce(
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
          CompilerOptionName,
          Pick<AuditOutput, 'slug' | 'details'>
        >,
      );

    return expectedAudits.map(({ slug }) => {
      const { details } = result[slug as CompilerOptionName] ?? {};

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
