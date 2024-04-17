import { type AuditOutputs } from '@code-pushup/models';
import { formatGitPath, getGitRoot } from '@code-pushup/utils';

export async function normalizeAuditOutputs(
  audits: AuditOutputs,
): Promise<AuditOutputs> {
  const gitRoot = await getGitRoot();

  return audits.map(audit => {
    const { issues = [], table } = audit.details ?? {};
    if (
      // @TODO should be covered by type I guess?
      issues.every(issue => issue.source == null)
    ) {
      return audit;
    }
    return {
      ...audit,
      details: {
        ...audit.details,
        table: table,
        issues: issues.map(issue =>
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
