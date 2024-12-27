import type {
  Audit,
  AuditOutput,
  AuditOutputs,
  AuditReport,
  Issue,
  RunnerFunction,
} from '@code-pushup/models';
import type { TypescriptPluginOptions } from '../types.js';
import { AUDIT_LOOKUP } from './constants.js';
import { getTypeScriptDiagnostics } from './ts-runner.js';
import type { CompilerOptionName } from './types.js';
import { getIssueFromDiagnostic, tSCodeToAuditSlug } from './utils.js';

export type RunnerOptions = TypescriptPluginOptions & {
  expectedAudits: Audit[];
};

export function createRunnerFunction(options: RunnerOptions): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const diagnostics = await getTypeScriptDiagnostics(options.tsConfigPath);
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

    return options.expectedAudits.map(audit => {
      const { details } = result[audit.slug as CompilerOptionName];
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
