import type { LintResult, Secondary, Severity, Warning } from 'stylelint';
import type { Audit, AuditOutputs, AuditReport } from '@code-pushup/models';
import type { ActiveConfigRuleSetting } from './model.js';

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
    const {
      source,
      warnings,
      // @TODO
      // invalidOptionWarnings, deprecations, parseErrors
    } = result;

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

/**
 * Function that returns the severity from a ruleConfig.
 * If the ruleConfig is not an array, the default severity of the config file must be returned, since the custom severity can be only specified in an array.
 * If the ruleConfig is an array, a custom severity might have been set, in that case, it must be returned
 * @param ruleConfig - The Stylelint rule config value
 * @param defaultSeverity - The default severity of the config file. By default, it's 'error'
 * @returns The severity (EX: 'error' | 'warning')
 */
export function getSeverityFromRuleConfig(
  ruleConfig: ActiveConfigRuleSetting,
  defaultSeverity: Severity = 'error',
): Severity {
  //If it's not an array, the default severity of the config file must be returned, since the custom severity can be only specified in an array.
  if (!Array.isArray(ruleConfig)) {
    return defaultSeverity;
  }

  // If it's an array, a custom severity might have been set, in that case, it must be returned

  const secondary: Secondary = ruleConfig.at(1);

  if (secondary == null) {
    return defaultSeverity;
  }

  if (!secondary['severity']) {
    return defaultSeverity;
  }

  if (typeof secondary['severity'] === 'function') {
    console.warn('Function severity is not supported');
    return defaultSeverity;
  }

  return secondary['severity'];
}
