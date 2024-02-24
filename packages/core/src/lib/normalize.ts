import { type AuditOutputs } from '@code-pushup/models';
import { formatGitPath, getGitRoot } from '@code-pushup/utils';

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
          issue.source == null
            ? issue
            : {
                ...issue,
                source: {
                  ...issue.source,
                  file: formatGitPath(issue.source.file, gitRoot),
                },
              },
        ),
      },
    };
  });
}
