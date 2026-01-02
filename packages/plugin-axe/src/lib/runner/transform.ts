import axe from 'axe-core';
import type {
  AuditOutput,
  AuditOutputs,
  Issue,
  IssueSeverity,
} from '@code-pushup/models';
import {
  formatIssueSeverities,
  getUrlIdentifier,
  pluralizeToken,
  truncateIssueMessage,
} from '@code-pushup/utils';

/**
 * Transforms Axe results into audit outputs.
 * Priority: violations > incomplete > passes > inapplicable
 */
export function toAuditOutputs(
  { passes, violations, incomplete, inapplicable }: axe.AxeResults,
  urlSuffix: string,
): AuditOutputs {
  const toEntries = (results: axe.Result[], score: number) =>
    results.map(res => [res.id, toAuditOutput(res, urlSuffix, score)] as const);

  return [
    ...new Map<string, AuditOutput>([
      ...toEntries(inapplicable, 1),
      ...toEntries(passes, 1),
      ...toEntries(incomplete, 0),
      ...toEntries(violations, 0),
    ]).values(),
  ];
}

/** Creates a URL suffix for issue messages, only included when analyzing multiple URLs. */
export function createUrlSuffix(url: string, urlsCount: number): string {
  return urlsCount > 1 ? ` ([${getUrlIdentifier(url)}](${url}))` : '';
}

/**
 * For failing audits (score 0), includes detailed issues with locations and severities.
 * For passing audits (score 1), only includes element count.
 */
function toAuditOutput(
  result: axe.Result,
  urlSuffix: string,
  score: number,
): AuditOutput {
  const base = {
    slug: result.id,
    score,
    value: result.nodes.length,
  };

  if (score === 0 && result.nodes.length > 0) {
    const issues = result.nodes.map(node => toIssue(node, result, urlSuffix));

    return {
      ...base,
      displayValue: formatIssueSeverities(issues),
      details: { issues },
    };
  }

  return {
    ...base,
    displayValue: pluralizeToken('element', result.nodes.length),
  };
}

function formatSelector(selector: axe.CrossTreeSelector): string {
  if (typeof selector === 'string') {
    return selector;
  }
  return selector.join(' >> ');
}

function toIssue(
  node: axe.NodeResult,
  result: axe.Result,
  urlSuffix: string,
): Issue {
  const selector = formatSelector(node.target?.[0] || node.html);
  const rawMessage = node.failureSummary || result.help;
  const cleanedMessage = rawMessage.replace(/\s+/g, ' ').trim();

  return {
    message: truncateIssueMessage(
      `[\`${selector}\`] ${cleanedMessage}${urlSuffix}`,
    ),
    severity: impactToSeverity(node.impact),
  };
}

function impactToSeverity(impact: axe.ImpactValue | undefined): IssueSeverity {
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
