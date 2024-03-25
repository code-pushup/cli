import type { AuditOutput, Issue, IssueSeverity } from '@code-pushup/models';
import { objectToEntries } from '@code-pushup/utils';
import {
  DependencyGroup,
  PackageAuditLevel,
  PackageManager,
  packageAuditLevels,
} from '../../config';
import { auditScoreModifiers } from './constants';
import { AuditResult } from './types';

export function auditResultToAuditOutput(
  result: AuditResult,
  packageManager: PackageManager,
  dependenciesType: DependencyGroup,
  auditLevelMapping: Record<PackageAuditLevel, IssueSeverity>,
): AuditOutput {
  const issues = vulnerabilitiesToIssues(
    result.vulnerabilities,
    auditLevelMapping,
  );

  return {
    slug: `${packageManager}-audit-${dependenciesType}`,
    score: calculateAuditScore(result.summary),
    value: result.summary.total,
    displayValue: vulnerabilitiesToDisplayValue(result.summary),
    ...(issues.length > 0 && { details: { issues } }),
  };
}

export function calculateAuditScore(
  stats: Record<PackageAuditLevel | 'total', number>,
) {
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

export function vulnerabilitiesToDisplayValue(
  vulnerabilities: Record<PackageAuditLevel | 'total', number>,
): string {
  if (vulnerabilities.total === 0) {
    return '0 vulnerabilities';
  }

  const vulnerabilityStats = packageAuditLevels
    .map(level =>
      vulnerabilities[level] > 0 ? `${vulnerabilities[level]} ${level}` : '',
    )
    .filter(text => text !== '')
    .join(', ');
  return `${vulnerabilities.total} ${
    vulnerabilities.total === 1 ? 'vulnerability' : 'vulnerabilities'
  } (${vulnerabilityStats})`;
}

export function vulnerabilitiesToIssues(
  vulnerabilities: AuditResult['vulnerabilities'],
  auditLevelMapping: Record<PackageAuditLevel, IssueSeverity>,
): Issue[] {
  if (vulnerabilities.length === 0) {
    return [];
  }

  return Object.values(vulnerabilities).map<Issue>(detail => {
    const versionRange =
      detail.versionRange === '*'
        ? '**all** versions'
        : `versions **${detail.versionRange}**`;
    const depHierarchy =
      typeof detail.directDependency === 'string'
        ? `\`${detail.directDependency}\`'${
            detail.directDependency.endsWith('s') ? '' : 's'
          } dependency \`${detail.name}\``
        : `\`${detail.name}\` dependency`;

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
