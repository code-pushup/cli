import { type AuditOutputs, Issue } from '@code-pushup/models';
import { formatGitPath, getGitRoot } from '@code-pushup/utils';

export function normalizeIssue(issue: Issue, gitRoot: string): Issue {
  // early exit to avoid issue object cloning
  return issue.source == null
    ? issue
    : {
        ...issue,
        source: {
          ...issue.source,
          file: formatGitPath(issue.source.file, gitRoot),
        },
      };
}

export async function normalizeAuditOutputs(
  audits: AuditOutputs,
): Promise<AuditOutputs> {
  const gitRoot = await getGitRoot();

  return audits.map(audit => {
    // early exit to avoid details object cloning
    if (audit.details == null) {
      return audit;
    }
    const { issues, table, ...details } = audit.details ?? {};
    const noPathsInIssues =
      Array.isArray(issues) && issues.every(issue => issue.source == null);
    return {
      ...audit,
      details: {
        ...details,
        ...(table ? { table } : {}),
        ...(issues == null
          ? {}
          : {
              // early exit to avoid issues object cloning
              issues: noPathsInIssues
                ? issues
                : issues.map(issue => normalizeIssue(issue, gitRoot)),
            }),
      },
    };
  });
}
