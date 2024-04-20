import { type AuditOutputs } from '@code-pushup/models';
import { formatGitPath, getGitRoot } from '@code-pushup/utils';

export async function normalizeAuditOutputs(
  audits: AuditOutputs,
): Promise<AuditOutputs> {
  const gitRoot = await getGitRoot();

  return audits.map(audit => {
    const { issues = [], table } = audit.details ?? {};

    return {
      ...audit,
      details: {
        ...audit.details,
        table: table,
        // early exit to avoid object cloning
        issues: issues.every(issue => issue.source == null)
          ? issues
          : issues.map(issue =>
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
