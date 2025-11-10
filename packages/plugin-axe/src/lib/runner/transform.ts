import type { AxeResults, ImpactValue, NodeResult, Result } from 'axe-core';
import type axe from 'axe-core';
import type {
  AuditOutput,
  AuditOutputs,
  Issue,
  IssueSeverity,
} from '@code-pushup/models';
import {
  countOccurrences,
  objectToEntries,
  pluralizeToken,
  truncateIssueMessage,
} from '@code-pushup/utils';

/**
 * Transforms Axe results into audit outputs.
 * Priority: violations > incomplete > passes > inapplicable
 */
export function toAuditOutputs(
  { passes, violations, incomplete, inapplicable }: AxeResults,
  url: string,
): AuditOutputs {
  const auditMap = new Map<string, AuditOutput>([
    ...inapplicable.map(res => [res.id, toAuditOutput(res, url, 1)] as const),
    ...passes.map(res => [res.id, toAuditOutput(res, url, 1)] as const),
    ...incomplete.map(res => [res.id, toAuditOutput(res, url, 0)] as const),
    ...violations.map(res => [res.id, toAuditOutput(res, url, 0)] as const),
  ]);

  return Array.from(auditMap.values());
}

/**
 * For failing audits (score 0), includes detailed issues with locations and severities.
 * For passing audits (score 1), only includes element count.
 */
function toAuditOutput(
  result: Result,
  url: string,
  score: number,
): AuditOutput {
  const base = {
    slug: result.id,
    score,
    value: result.nodes.length,
  };

  if (score === 0 && result.nodes.length > 0) {
    const issues = result.nodes.map(node => toIssue(node, result, url));

    return {
      ...base,
      displayValue: formatSeverityCounts(issues),
      details: { issues },
    };
  }

  return {
    ...base,
    displayValue: pluralizeToken('element', result.nodes.length),
  };
}

function formatSeverityCounts(issues: Issue[]): string {
  const severityCounts = countOccurrences(
    issues.map(({ severity }) => severity),
  );

  return objectToEntries(severityCounts)
    .toSorted(([a], [b]) => {
      const order = { error: 0, warning: 1, info: 2 };
      return order[a] - order[b];
    })
    .map(([severity, count = 0]) => pluralizeToken(severity, count))
    .join(', ');
}

function formatSelector(selector: axe.CrossTreeSelector): string {
  if (typeof selector === 'string') {
    return selector;
  }
  return selector.join(' >> ');
}

function toIssue(node: NodeResult, result: Result, url: string): Issue {
  const selector = formatSelector(node.target?.[0] || node.html);
  const rawMessage = node.failureSummary || result.help;
  const cleanedMessage = rawMessage.replace(/\s+/g, ' ').trim();

  const message = `[${selector}] ${cleanedMessage} (${url})`;

  return {
    message: truncateIssueMessage(message),
    severity: impactToSeverity(node.impact),
  };
}

function impactToSeverity(impact: ImpactValue | undefined): IssueSeverity {
  switch (impact) {
    case 'critical':
    case 'serious':
      return 'error';
    case 'moderate':
      return 'warning';
    case 'minor':
    case null:
    case undefined:
      return 'info';
  }
}
