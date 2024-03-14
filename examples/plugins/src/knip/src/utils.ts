import type {Issue, IssueRecords, ReporterOptions} from "knip/dist/types/issues";
import {slugify} from "@code-pushup/utils";
import {AuditOutput} from "@code-pushup/models";
import type {Entries} from "type-fest";

const processIssue = (issue: Issue) => ({
  message: `${issue.type} ${issue.symbol || 'File unused'}`,
  severity: 'warning' as const,
  ...(issue.filePath || issue.line || issue.col ? {
    source: {
      ...(issue.filePath ? { file: issue.filePath } : { file: '???' }),
      ...(issue.line && issue.col ? { position: {
          startLine: issue.line,
          startColumn: issue.col,
        }} : {}),
    },
  } : {}),
});

export function createAuditOutputFromKnipIssues(type: string, issues: Issue[]): AuditOutput {
  return ({
    slug: slugify(type),
    value: issues.length,
    displayValue: `${issues.length} ${type}`,
    score: issues.length > 0 ? 0 : 1,
    details: { issues: issues.map(processIssue) },
  });
}

export function knipToCpReport({ report, issues }: Pick<ReporterOptions, 'report' | 'issues'> ) {
  return (Object.entries(report) as Entries<ReporterOptions['report']>)
    .filter(([_, isReported]) => isReported)
    .map(([type]) => {
      const issueRecords: IssueRecords = issues[type] as IssueRecords;
      const issueArray: Issue[] = Object.values(issueRecords).flat().map(issue => ({ ...issue, type } as Issue));
      return createAuditOutputFromKnipIssues(type, issueArray);
    });
};

