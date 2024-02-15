import {
  type AuditOutputs,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  PersistConfig,
} from '@code-pushup/models';
import { formatGitPath, getGitRoot } from '@code-pushup/utils';

export function normalizePersistConfig(
  cfg?: Partial<PersistConfig>,
): Required<PersistConfig> {
  return {
    outputDir: PERSIST_OUTPUT_DIR,
    filename: PERSIST_FILENAME,
    format: PERSIST_FORMAT,
    ...cfg,
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
