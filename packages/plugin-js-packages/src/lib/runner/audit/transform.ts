import type { AuditOutput, Issue, IssueSeverity } from '@code-pushup/models';
import { objectToEntries } from '@code-pushup/utils';
import {
  PackageAuditLevel,
  PackageDependency,
  packageAuditLevels,
} from '../../config';
import { NpmAuditResultJson, Vulnerabilities } from './types';

export function auditResultToAuditOutput(
  result: NpmAuditResultJson,
  dependenciesType: PackageDependency,
  auditLevelMapping: Record<PackageAuditLevel, IssueSeverity>,
): AuditOutput {
  const issues = vulnerabilitiesToIssues(
    result.vulnerabilities,
    auditLevelMapping,
  );
  return {
    slug: `npm-audit-${dependenciesType}`,
    score: result.metadata.vulnerabilities.total === 0 ? 1 : 0,
    value: result.metadata.vulnerabilities.total,
    displayValue: vulnerabilitiesToDisplayValue(
      result.metadata.vulnerabilities,
    ),
    ...(issues.length > 0 && { details: { issues } }),
  };
}

export function vulnerabilitiesToDisplayValue(
  vulnerabilities: Record<PackageAuditLevel | 'total', number>,
): string {
  if (vulnerabilities.total === 0) {
    return 'passed';
  }

  const displayValue = packageAuditLevels
    .map(level =>
      vulnerabilities[level] > 0 ? `${vulnerabilities[level]} ${level}` : '',
    )
    .filter(text => text !== '')
    .join(', ');
  return `${displayValue} ${
    vulnerabilities.total === 1 ? 'vulnerability' : 'vulnerabilities'
  }`;
}

export function vulnerabilitiesToIssues(
  vulnerabilities: Vulnerabilities,
  auditLevelMapping: Record<PackageAuditLevel, IssueSeverity>,
): Issue[] {
  if (Object.keys(vulnerabilities).length === 0) {
    return [];
  }

  return objectToEntries(vulnerabilities).map<Issue>(([, detail]) => {
    // Advisory details via can refer to another vulnerability
    // For now, only direct context is supported
    if (
      Array.isArray(detail.via) &&
      detail.via.length > 0 &&
      typeof detail.via[0] === 'object'
    ) {
      return {
        message: `${detail.name} dependency has a vulnerability "${
          detail.via[0].title
        }" for versions ${detail.range}. Fix is ${
          detail.fixAvailable ? '' : 'not '
        }available. More information [here](${detail.via[0].url})`,
        severity: auditLevelMapping[detail.severity],
      };
    }

    return {
      message: `${detail.name} dependency has a vulnerability for versions ${
        detail.range
      }. Fix is ${detail.fixAvailable ? '' : 'not '}available.`,
      severity: auditLevelMapping[detail.severity],
    };
  });
}
