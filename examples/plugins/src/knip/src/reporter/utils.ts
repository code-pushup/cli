import type {
  IssueSet,
  IssueType,
  Issue as KnipIssue,
  Issues as KnipIssues,
  IssueSeverity as KnipSeverity,
  ReporterOptions,
} from 'knip/dist/types/issues';
import type { Entries } from 'type-fest';
import {
  AuditOutput,
  AuditOutputs,
  IssueSeverity as CondPushupIssueSeverity,
  Issue as CpIssue,
  Issue,
} from '@code-pushup/models';
import { formatGitPath, getGitRoot, slugify } from '@code-pushup/utils';
import { ISSUE_TYPE_MESSAGE, ISSUE_TYPE_TITLE } from './constants';
import { DeepPartial } from './types';

const severityMap: Record<KnipSeverity | 'unknown', CondPushupIssueSeverity> = {
  unknown: 'info',
  off: 'info',
  error: 'error',
  warn: 'warning',
} as const;

export function knipToCpReport({
  issues: rawIssues = {},
  report,
}: DeepPartial<ReporterOptions>): Promise<AuditOutputs> {
  return Promise.all(
    (Object.entries(report ?? {}) as Entries<typeof report>)
      .filter(([_, isReportType]) => isReportType)
      .map(async ([issueType]): Promise<AuditOutput> => {
        const issues = await toIssues(issueType, rawIssues);
        return {
          slug: slugify(
            ISSUE_TYPE_TITLE[issueType as keyof typeof ISSUE_TYPE_TITLE],
          ),
          score: issues.length === 0 ? 1 : 0,
          value: issues.length,
          ...(issues.length > 0 ? { details: { issues } } : {}),
        };
      }),
  );
}

export function getPosition(issue: KnipIssue) {
  return issue.line && issue.col
    ? {
        startColumn: issue.col,
        startLine: issue.line,
      }
    : false;
}

export async function toIssues(
  issueType: IssueType,
  issues: DeepPartial<KnipIssues>,
): Promise<CpIssue[]> {
  const isSet = issues[issueType] instanceof Set;
  const issuesForType: string[] | KnipIssue[] = isSet
    ? [...(issues[issueType] as IssueSet)]
    : Object.values(issues[issueType] as Issue).flatMap(Object.values);

  const gitRoot = await getGitRoot();
  if (issuesForType.length > 0) {
    if (isSet) {
      const knipIssueSets = issuesForType as string[];
      return knipIssueSets.map(
        (filePath): CpIssue => ({
          message: ISSUE_TYPE_MESSAGE[issueType](filePath),
          severity: severityMap['unknown'], // @TODO rethink
          source: {
            file: formatGitPath(filePath, gitRoot),
          },
        }),
      );
    } else {
      const knipIssues = issuesForType as KnipIssue[];
      return knipIssues.map((issue): CpIssue => {
        const { symbol, filePath, severity = 'unknown' } = issue;
        const position = getPosition(issue);
        return {
          message: ISSUE_TYPE_MESSAGE[issueType](symbol),
          severity: severityMap[severity],
          source: {
            file: filePath,
            ...(position ? { position } : {}),
          },
        };
      });
    }
  }
  return [];
}
