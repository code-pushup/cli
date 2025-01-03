import { type LintResult } from 'stylelint';
import type { Audit, AuditOutputs, AuditReport } from '@code-pushup/models';

export function mapStylelintResultsToAudits(
  results: LintResult[],
  expectedAudits: Audit[],
): AuditOutputs {
  const initialAuditMap = expectedAudits.reduce((map, audit) => {
    return map.set(audit.slug, {
      ...audit,
      score: 1,
      value: 0,
      details: {
        issues: [],
      },
    });
  }, new Map<string, AuditReport>());

  const auditMap = results.reduce((map, result) => {
    const { source, warnings } = result;

    if (source === undefined) {
      throw new Error('Stylelint source can`t be undefined');
    }

    return warnings.reduce((innerMap, warning) => {
      const { rule, severity, line, text } = warning;

      const existingAudit = innerMap.get(rule);
      if (!existingAudit) {
        return innerMap;
      }

      const updatedAudit: AuditReport = {
        ...existingAudit,
        score: 0, // At least one issue exists
        value: existingAudit.value + 1,
        details: {
          issues: [
            ...(existingAudit.details?.issues ?? []),
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

      return innerMap.set(rule, updatedAudit);
    }, map);
  }, initialAuditMap);

  console.log('auditMap: ', auditMap);

  return [...auditMap.values()];
}
