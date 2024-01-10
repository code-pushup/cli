import type { Linter } from 'eslint';
import type { AuditOutput, Issue } from '@code-pushup/models';
import { IssueSeverity } from '@code-pushup/models';
import {
  compareIssueSeverity,
  countOccurrences,
  objectToEntries,
  pluralizeToken,
} from '@code-pushup/utils';
import { ruleIdToSlug } from '../meta/hash';
import type { LinterOutput } from './types';

type LintIssue = Linter.LintMessage & {
  relativeFilePath: string;
};

export function lintResultsToAudits({
  results,
  ruleOptionsPerFile,
}: LinterOutput): AuditOutput[] {
  const issuesPerAudit = results
    .flatMap(({ messages, relativeFilePath }) =>
      messages.map((message): LintIssue => ({ ...message, relativeFilePath })),
    )
    .reduce<Record<string, LintIssue[]>>((acc, issue) => {
      const { ruleId, message, relativeFilePath } = issue;
      if (!ruleId) {
        console.warn(`ESLint core error - ${message}`);
        return acc;
      }
      const options = ruleOptionsPerFile[relativeFilePath]?.[ruleId] ?? [];
      const auditSlug = ruleIdToSlug(ruleId, options);
      return { ...acc, [auditSlug]: [...(acc[auditSlug] ?? []), issue] };
    }, {});

  return Object.entries(issuesPerAudit).map(entry => toAudit(...entry));
}

function toAudit(slug: string, issues: LintIssue[]): AuditOutput {
  const auditIssues = issues.map(convertIssue);
  const severityCounts = countOccurrences(
    auditIssues.map(({ severity }) => severity),
  );
  const severities = objectToEntries(severityCounts);
  const summaryText = severities
    .sort((a, b) => -compareIssueSeverity(a[0], b[0]))
    .map(([severity, count = 0]) => pluralizeToken(severity, count))
    .join(', ');

  return {
    slug,
    score: Number(auditIssues.length === 0),
    value: auditIssues.length,
    displayValue: summaryText,
    details: {
      issues: auditIssues,
    },
  };
}

function convertIssue(issue: LintIssue): Issue {
  return {
    message: issue.message,
    severity: convertSeverity(issue.severity),
    source: {
      file: issue.relativeFilePath,
      position: {
        startLine: issue.line,
        startColumn: issue.column,
        endLine: issue.endLine,
        endColumn: issue.endColumn,
      },
    },
  };
}

function convertSeverity(severity: Linter.Severity): IssueSeverity {
  switch (severity) {
    case 2:
      return 'error';
    case 1:
      return 'warning';
    case 0:
      // shouldn't happen
      throw new Error(`Unexpected severity ${severity} in ESLint results`);
  }
}
