import type { AuditOutput, AuditReport } from '@code-pushup/models';
import { osAgnosticPath } from '@code-pushup/test-utils';

export function osAgnosticAudit<T extends AuditOutput | AuditReport>(
  audit: T,
  transformMessage: (message: string) => string = s => s,
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
              message: transformMessage(issue.message),
            },
      ),
    },
  };
}

export function osAgnosticAuditOutputs<T extends AuditOutput | AuditReport>(
  audits: T[],
  transformAuditIssueMessage?: (message: string) => string,
): T[] {
  return audits.map(audit =>
    osAgnosticAudit(audit, transformAuditIssueMessage),
  );
}
