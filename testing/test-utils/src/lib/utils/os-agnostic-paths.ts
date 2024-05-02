import type {
  AuditOutput,
  AuditOutputs,
  AuditReport,
} from '@code-pushup/models';

export function osAgnosticPath(path: string): string {
  return path.replace(process.cwd(), '<CWD>').replace(/\\/g, '/');
}

export function osAgnosticAudit<T extends AuditOutput | AuditReport>(
  audit: T,
): T {
  const { issues = [] } = audit.details ?? {};
  if (issues.every(({ source }) => source == null)) {
    return audit;
  }
  return {
    ...audit,
    details: {
      issues: issues.map(issue =>
        issue.source == null
          ? issue
          : {
              ...issue,
              source: {
                ...issue.source,
                file: osAgnosticPath(issue.source.file),
              },
            },
      ),
    },
  };
}

export function osAgnosticAuditOutputs(audits: AuditOutputs): AuditOutputs {
  return audits.map(osAgnosticAudit);
}
