import type { AuditOutputs, Issue } from '@code-pushup/models';
import { formatGitPath, getGitRoot, isFileIssue } from '@code-pushup/utils';

export function normalizeIssue(issue: Issue, gitRoot: string): Issue {
  // Early exit to avoid cloning; only file sources need path normalization
  if (!isFileIssue(issue)) {
    return issue;
  }
  const { source, ...issueWithoutSource } = issue;
  return {
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
