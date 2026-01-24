import type {
  AuditOutput,
  AuditReport,
  IssueSource,
  SourceFileLocation,
} from '@code-pushup/models';
import { osAgnosticPath } from '@code-pushup/test-utils';

function isFileSource(source: IssueSource): source is SourceFileLocation {
  return 'file' in source;
}

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
      issues: issues.map(issue => {
        if (issue.source == null || !isFileSource(issue.source)) {
          return issue;
        }
        return {
          ...issue,
          source: {
            ...issue.source,
            file: osAgnosticPath(issue.source.file),
          },
          message: transformMessage(issue.message),
        };
      }),
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
