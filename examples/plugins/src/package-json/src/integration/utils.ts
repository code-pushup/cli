import { AuditOutput, Issue } from '@code-pushup/models';
import {
  factorOf,
  findLineNumberInText,
  pluralizeToken,
} from '@code-pushup/utils';
import { PackageJson, SourceResult } from './types';

export function baseAuditOutput(slug: string): AuditOutput {
  return {
    slug,
    score: 1,
    value: 0,
    displayValue: pluralizePackage(),
  } satisfies AuditOutput;
}

export function filterSeverityError(issue: Issue): issue is Issue {
  return issue.severity === 'error';
}

export function pluralizePackage(num = 0): string {
  return pluralizeToken('package', num);
}

export function assertPropertyEmpty(
  result: SourceResult,
  property: keyof PackageJson,
  value: unknown = undefined,
): Issue {
  const { file, content } = result;
  const source: Issue['source'] = {
    file,
  };

  if (value === undefined) {
    return {
      message: `${property} undefined`,
      severity: 'error',
      source,
    };
  }

  if (value === '') {
    return {
      message: `${property} empty`,
      severity: 'error',
      source: {
        ...source,
        position: {
          startLine: findLineNumberInText(content, `"${property}":`) as number,
        },
      },
    };
  }

  return {
    message: `${property} OK`,
    severity: 'info',
    source,
  };
}

export function assertPropertyEqual(
  result: SourceResult,
  property: keyof PackageJson,
  value: unknown,
): Issue {
  const { file, content, json } = result;
  if (json[property] !== value) {
    const startLine: null | number = findLineNumberInText(
      content,
      `"${property}":`,
    );
    return {
      severity: 'error',
      message: `${property} should be ${value?.toString()} but is ${json[
        property
      ]?.toString()}`,
      source: {
        file,
        ...(startLine == null ? {} : { position: { startLine } }),
      },
    };
  }
  return {
    message: `${property} value is given`,
    severity: 'info',
    source: {
      file,
    },
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
