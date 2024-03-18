import type { AuditOutput, Issue, IssueSeverity } from '@code-pushup/models';
import { objectToEntries } from '@code-pushup/utils';
import {
  DependencyGroup,
  PackageAuditLevel,
  packageAuditLevels,
} from '../../config';
import { auditScoreModifiers } from './constants';
import { NpmAuditResultJson, Vulnerabilities } from './types';

export function auditResultToAuditOutput(
  result: NpmAuditResultJson,
  dependenciesType: DependencyGroup,
  auditLevelMapping: Record<PackageAuditLevel, IssueSeverity>,
): AuditOutput {
  const issues = vulnerabilitiesToIssues(
    result.vulnerabilities,
    auditLevelMapping,
  );
  return {
    slug: `npm-audit-${dependenciesType}`,
    score: calculateAuditScore(result.metadata.vulnerabilities),
    value: result.metadata.vulnerabilities.total,
    displayValue: vulnerabilitiesToDisplayValue(
      result.metadata.vulnerabilities,
    ),
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
  vulnerabilities: Vulnerabilities,
  auditLevelMapping: Record<PackageAuditLevel, IssueSeverity>,
): Issue[] {
  if (Object.keys(vulnerabilities).length === 0) {
    return [];
  }

  return Object.values(vulnerabilities).map<Issue>(detail => {
    const versionRange =
      detail.range === '*'
        ? '**all** versions'
        : `versions **${detail.range}**`;
    const vulnerabilitySummary = `\`${detail.name}\` dependency has a **${detail.severity}** vulnerability in ${versionRange}.`;
    const fixInformation =
      typeof detail.fixAvailable === 'boolean'
        ? `Fix is ${detail.fixAvailable ? '' : 'not '}available.`
        : `Fix available: Update \`${detail.fixAvailable.name}\` to version **${
            detail.fixAvailable.version
          }**${
            detail.fixAvailable.isSemVerMajor ? ' (breaking change).' : '.'
          }`;

    // Advisory details via can refer to another vulnerability
    // For now, only direct context is supported
    if (
      Array.isArray(detail.via) &&
      detail.via.length > 0 &&
      typeof detail.via[0] === 'object'
    ) {
      return {
        message: `${vulnerabilitySummary} ${fixInformation} More information: [${detail.via[0].title}](${detail.via[0].url})`,
        severity: auditLevelMapping[detail.severity],
      };
    }

    return {
      message: `${vulnerabilitySummary} ${fixInformation}`,
      severity: auditLevelMapping[detail.severity],
    };
  });
}
