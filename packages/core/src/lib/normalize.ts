import { type AuditOutputs, Issue } from '@code-pushup/models';
import { formatGitPath, getGitRoot } from '@code-pushup/utils';

export function normalizeIssue(issue: Issue, gitRoot: string): Issue {
  const { source, ...issueWithoutSource } = issue;
  // early exit to avoid issue object cloning.
  return source == null
    ? issue
    : {
        ...issueWithoutSource,
        source: {
          ...source,
          file: formatGitPath(source.file, gitRoot),
        },
      };
}

export async function normalizeAuditOutputs(
  audits: AuditOutputs,
): Promise<AuditOutputs> {
  const gitRoot = await getGitRoot();

  return audits.map(audit => {
    // early exit to avoid issues object cloning.
    const noPathsInIssues =
      Array.isArray(audit.details?.issues) &&
      audit.details?.issues.every(issue => issue.source == null);
    if (audit.details == null || noPathsInIssues) {
      return audit;
    }
    const { issues, ...details } = audit.details;
    return {
      ...audit,
      details: {
        ...details,
        ...(issues == null
          ? {}
          : {
              issues: issues.map(issue => normalizeIssue(issue, gitRoot)),
            }),
      },
    };
  });
}
