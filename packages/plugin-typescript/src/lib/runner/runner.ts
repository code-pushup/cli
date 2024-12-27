import type {Audit, AuditOutput, AuditOutputs, AuditReport, Issue, RunnerFunction,} from '@code-pushup/models';
import type {CompilerOptionName, TypescriptPluginOptions} from '../types.js';
import {getDiagnostics,} from './typescript-runner.js';
import {AUDIT_LOOKUP, getIssueFromDiagnostic, tSCodeToAuditSlug, validateDiagnostics} from './utils.js';
export type RunnerOptions = TypescriptPluginOptions & {filteredAudits: Audit[]};

export function createRunnerFunction(options: RunnerOptions): RunnerFunction {
  return async (): Promise<AuditOutputs> => {

    const diagnostics = await getDiagnostics(options.tsConfigPath);
    validateDiagnostics(diagnostics);
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
          Pick<AuditReport, 'slug' | 'details'>
        >,
      );

    return options.filteredAudits.map(audit => {
      const { details } = result[audit.slug as CompilerOptionName] ?? {};
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
