import type { AuditOutput, Issue } from '@code-pushup/models';
import { apostrophize, objectToEntries } from '@code-pushup/utils';
import {
  AuditSeverity,
  DependencyGroup,
  PackageManagerId,
  packageAuditLevels,
} from '../../config';
import { auditScoreModifiers } from './constants';
import { AuditResult, AuditSummary, Vulnerability } from './types';

export function auditResultToAuditOutput(
  result: AuditResult,
  id: PackageManagerId,
  depGroup: DependencyGroup,
  auditLevelMapping: AuditSeverity,
): AuditOutput {
  const issues = vulnerabilitiesToIssues(
    result.vulnerabilities,
    auditLevelMapping,
  );

  return {
    slug: `${id}-audit-${depGroup}`,
    score: calculateAuditScore(result.summary),
    value: result.summary.total,
    displayValue: summaryToDisplayValue(result.summary),
    details: { issues },
  };
}

export function calculateAuditScore(stats: AuditSummary) {
  if (stats.total === 0) {
    return 1;
  }

  return objectToEntries(stats).reduce<number>(
    (score, [level, vulnerabilities]) => {
      if (level === 'total') {
        return score;
      }

      const reducedScore = score - auditScoreModifiers[level] * vulnerabilities;
      return Math.max(reducedScore, 0);
    },
    1,
  );
}

export function summaryToDisplayValue(summary: AuditSummary): string {
  if (summary.total === 0) {
    return '0 vulnerabilities';
  }

  const vulnerabilityStats = packageAuditLevels
    .map(level => (summary[level] > 0 ? `${summary[level]} ${level}` : ''))
    .filter(text => text !== '')
    .join(', ');
  return `${summary.total} ${
    summary.total === 1 ? 'vulnerability' : 'vulnerabilities'
  } (${vulnerabilityStats})`;
}

export function vulnerabilitiesToIssues(
  vulnerabilities: Vulnerability[],
  auditLevelMapping: AuditSeverity,
): Issue[] {
  if (vulnerabilities.length === 0) {
    return [];
  }

  return vulnerabilities.map((detail): Issue => {
    const versionRange =
      detail.versionRange === '*'
        ? '**all** versions'
        : `versions **${detail.versionRange}**`;
    const directDependency =
      typeof detail.directDependency === 'string' &&
      detail.directDependency !== ''
        ? `\`${detail.directDependency}\``
        : '';
    const depHierarchy =
      directDependency === ''
        ? `\`${detail.name}\` dependency`
        : `${apostrophize(directDependency)} dependency \`${detail.name}\``;

    const vulnerabilitySummary = `has a **${detail.severity}** vulnerability in ${versionRange}.`;
    const fixInfo = detail.fixInformation ? ` ${detail.fixInformation}` : '';
    const additionalInfo =
      detail.title != null && detail.url != null
        ? ` More information: [${detail.title}](${detail.url})`
        : '';

    return {
      message: `${depHierarchy} ${vulnerabilitySummary}${fixInfo}${additionalInfo}`,
      severity: auditLevelMapping[detail.severity],
    };
  });
}
