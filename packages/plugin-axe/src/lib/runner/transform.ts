import axe from 'axe-core';
import type {
  AuditOutput,
  AuditOutputs,
  Issue,
  IssueSeverity,
  SourceUrlLocation,
} from '@code-pushup/models';
import {
  formatIssueSeverities,
  pluralizeToken,
  truncateIssueMessage,
} from '@code-pushup/utils';

/**
 * Transforms Axe results into audit outputs.
 * Priority: violations > incomplete > passes > inapplicable
 */
export function toAuditOutputs(
  { passes, violations, incomplete, inapplicable }: axe.AxeResults,
  url: string,
): AuditOutputs {
  const toEntries = (results: axe.Result[], score: number) =>
    results.map(res => [res.id, toAuditOutput(res, url, score)] as const);

  return [
    ...new Map<string, AuditOutput>([
      ...toEntries(inapplicable, 1),
      ...toEntries(passes, 1),
      ...toEntries(incomplete, 0),
      ...toEntries(violations, 0),
    ]).values(),
  ];
}

/**
 * For failing audits (score 0), includes detailed issues with locations and severities.
 * For passing audits (score 1), only includes element count.
 */
function toAuditOutput(
  result: axe.Result,
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

function toIssue(node: axe.NodeResult, result: axe.Result, url: string): Issue {
  const selector = node.target?.[0]
    ? formatSelector(node.target[0])
    : undefined;
  const rawMessage = node.failureSummary || result.help;
  const cleanMessage = rawMessage.replace(/\s+/g, ' ').trim();

  // TODO: Remove selector prefix from message once Portal supports URL sources
  const message = selector ? `[\`${selector}\`] ${cleanMessage}` : cleanMessage;

  const source: SourceUrlLocation = {
    url,
    ...(node.html && { snippet: node.html }),
    ...(selector && { selector }),
  };

  return {
    message: truncateIssueMessage(message),
    severity: impactToSeverity(node.impact),
    source,
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
