import type { ConfigRuleSettings, LintResult, Warning } from 'stylelint';
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
      const { rule, line, text } = warning;

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
              severity: getSeverityFromWarning(warning),
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

  return [...auditMap.values()];
}

export function getSeverityFromWarning(warning: Warning): 'error' | 'warning' {
  const { severity } = warning;

  if (severity === 'error' || severity === 'warning') {
    return severity;
  }
  throw new Error(`Unknown severity: ${severity}`);
}

export function getSeverityFromRuleConfig(
  ruleConfig: ConfigRuleSettings<unknown, { severity?: 'error' | 'warning' }>,
): 'error' | 'warning' {
  if (!ruleConfig) {
    // Default severity if the ruleConfig is null or undefined
    return 'error';
  }

  if (Array.isArray(ruleConfig)) {
    const options = ruleConfig[1];
    if (options && typeof options === 'object' && 'severity' in options) {
      const severity = options.severity;
      if (severity === 'warning') {
        return 'warning';
      }
    }
  }

  // Default severity if severity is not explicitly set
  return 'error';
}
