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
  stringifyError,
  toSentenceCase,
} from '@code-pushup/utils';
import type { AuditSlug } from '../types.js';
import { getTypeScriptDiagnostics } from './ts-runner.js';
import type { CodeRangeName } from './types.js';
import { getIssueFromDiagnostic, tsCodeToAuditSlug } from './utils.js';

export type RunnerOptions = {
  tsconfig: string[];
  expectedAudits: { slug: AuditSlug }[];
};

type DiagnosticResult = { code: number; issue: Issue };
type CollectResult = { diagnostics: DiagnosticResult[]; skipped: number };

type GroupedDiagnostics = Partial<
  Record<CodeRangeName, Pick<AuditOutput, 'slug' | 'details'>>
>;

function collectDiagnostics(tsconfigs: string[]): CollectResult {
  return tsconfigs.reduce<CollectResult>(
    (acc, config) => {
      try {
        const diagnostics = [
          ...getTypeScriptDiagnostics({ tsconfig: config }),
        ].map(diag => ({
          code: diag.code,
          issue: getIssueFromDiagnostic(diag),
        }));
        return { ...acc, diagnostics: [...acc.diagnostics, ...diagnostics] };
      } catch (error) {
        if (tsconfigs.length === 1) {
          throw error;
        }
        logger.warn(
          `Skipping ${config}: ${stringifyError(error, { oneline: true })}`,
        );
        return { ...acc, skipped: acc.skipped + 1 };
      }
    },
    { diagnostics: [], skipped: 0 },
  );
}

function groupDiagnosticsByAudit(
  diagnostics: DiagnosticResult[],
): GroupedDiagnostics {
  return diagnostics.reduce<GroupedDiagnostics>((acc, { code, issue }) => {
    const slug = tsCodeToAuditSlug(code);
    const existingIssues: Issue[] = acc[slug]?.details?.issues ?? [];
    return {
      ...acc,
      [slug]: { slug, details: { issues: [...existingIssues, issue] } },
    };
  }, {});
}

function logDiagnosticsSummary(result: GroupedDiagnostics): void {
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
}

export function createRunnerFunction(options: RunnerOptions): RunnerFunction {
  const { tsconfig, expectedAudits } = options;

  return (): AuditOutputs => {
    const { diagnostics, skipped } = collectDiagnostics(tsconfig);

    if (skipped === tsconfig.length) {
      throw new Error(
        `All ${tsconfig.length} TypeScript configurations failed to load`,
      );
    }
    logger.info(
      diagnostics.length === 0
        ? 'No TypeScript errors found'
        : `TypeScript compiler found ${pluralizeToken('diagnostic', diagnostics.length)}`,
    );

    const result = groupDiagnosticsByAudit(diagnostics);

    logDiagnosticsSummary(result);

    return expectedAudits.map(({ slug }): AuditOutput => {
      const issues = result[slug]?.details?.issues ?? [];
      return {
        slug,
        score: issues.length === 0 ? 1 : 0,
        value: issues.length,
        displayValue:
          issues.length === 0
            ? 'passed'
            : pluralizeToken('error', issues.length),
        ...(issues.length > 0 ? { details: { issues } } : {}),
      };
    });
  };
}
