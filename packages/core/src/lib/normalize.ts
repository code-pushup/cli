import type { AuditOutputs, Issue } from '@code-pushup/models';
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
    if (
      audit.details?.issues == null ||
      audit.details.issues.every(issue => issue.source == null)
    ) {
      return audit;
    }
    return {
      ...audit,
      details: {
        ...audit.details,
        issues: audit.details.issues.map(issue =>
          normalizeIssue(issue, gitRoot),
        ),
      },
    };
  });
}
