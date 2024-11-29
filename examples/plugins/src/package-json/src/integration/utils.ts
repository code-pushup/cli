import type { AuditOutput, Issue } from '@code-pushup/models';
import { factorOf, pluralizeToken } from '@code-pushup/utils';
import type { PackageJson, SourceResult } from './types.js';

export function baseAuditOutput(slug: string): AuditOutput {
  return {
    slug,
    score: 1,
    value: 0,
    displayValue: pluralizePackage(),
  };
}

export function filterSeverityError(issue: Issue): boolean {
  return issue.severity === 'error';
}

export function pluralizePackage(num = 0): string {
  return pluralizeToken('package', num);
}

export function assertPropertyEmpty(
  result: SourceResult,
  property: keyof PackageJson,
): Issue {
  const { json } = result;
  const value = json[property] as string | undefined;

  if (value === undefined) {
    return {
      message: `${property} undefined`,
      severity: 'error',
    };
  }

  if (value === '') {
    return {
      message: `${property} empty`,
      severity: 'error',
    };
  }

  return {
    message: `${property} OK`,
    severity: 'info',
  };
}

export function assertPropertyEqual(
  result: SourceResult,
  property: keyof PackageJson,
  value: unknown,
): Issue {
  const { json } = result;
  if (json[property] !== value) {
    return {
      severity: 'error',
      message: `${property} should be ${value?.toString()} but is ${json[
        property
      ]?.toString()}`,
    };
  }
  return {
    message: `${property} value is given`,
    severity: 'info',
  };
}

export function scoreByErrorIssues(slug: string, issues: Issue[]): AuditOutput {
  const errorCount = issues.filter(filterSeverityError).length;
  return {
    slug,
    score: factorOf(issues, filterSeverityError),
    value: errorCount,
    displayValue: pluralizePackage(errorCount),
    details: {
      issues,
    },
  };
}
