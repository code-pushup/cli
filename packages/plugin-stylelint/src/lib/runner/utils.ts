import type { LintResult } from 'stylelint';
import type { Audit, AuditReport } from '@code-pushup/models';

export function mapStylelintResultsToAudits(results: LintResult[]): Audit[] {
  const auditMap = results.reduce((map, result) => {
    const { source, warnings } = result;

    if (source === undefined) {
      throw new Error('Stylelint source can`t be undefined');
    }

    return warnings.reduce((innerMap, warning) => {
      const { rule, severity, line, text } = warning;

      const existingAudit: AuditReport = innerMap.get(rule) || {
        slug: rule,
        title: '',
        score: 1,
        value: 0,
        details: {
          issues: [],
        },
      };

      const updatedAudit: AuditReport = {
        ...existingAudit,
        score: 0, // At least one issue exists
        value: existingAudit.value + 1,
        details: {
          issues: [
            ...(existingAudit?.details?.issues ?? []),
            {
              severity,
              message: text,
              source: {
                file: source,
                position: {
                  startLine: line,
                },
              },
            },
          ],
        },
      };

      return new Map(innerMap).set(rule, updatedAudit);
    }, map);
  }, new Map<string, AuditReport>());

  return [...auditMap.values()];
}
