import {pluralizeToken} from '../../../../../dist/packages/utils/src';
import {AuditOutput, Issue} from '../../../../../packages/models/src';
import {factorOf, findLineNumberInText} from '../../../../../packages/utils/src';
import {PackageJson, SourceResult} from './types';

export function baseAuditOutput(slug: string): AuditOutput {
  return {
    slug,
    score: 1,
    value: 0,
    displayValue: pluralizeToken('packages'),
  }
};

export function filterSeverityError(issue: Issue): issue is Issue {
  return issue.severity === 'error';
}

export function pluralizePackage(num = 0): string {
  return pluralizeToken('package', num);
}

export function assertPropertyEmpty(
  result: SourceResult,
  property: keyof PackageJson = undefined,
  value: unknown = undefined,
): Issue {
  const {file, content} = result;
  const issue: Issue = {
    message: `${property} OK`,
    severity: 'info',
    source: {
      file,
    },
  };
  if (value === undefined || value === '') {
    issue.severity = 'error';
    issue.message = `${property} empty`;
    if (value === '') {
      issue.source = {
        file,
        position: {
          startLine: findLineNumberInText(content, `"${property}":`) as number,
        },
      };
    }
    return issue;
  }
}

export function assertPropertyEqual(
  result: SourceResult,
  property: keyof PackageJson = undefined,
  value: unknown = undefined,
): Issue {
  const {file, content, json} = result;
  const issue: Issue = {
    message: `${property} value is given`,
    severity: 'info',
    source: {
      file,
    },
  };
  if (json[property] !== value) {
    issue.severity = 'error';
    issue.message = `${property} should be ${value} but is ${json[property]}`;
    issue.source = {
      file,
      position: {
        startLine: findLineNumberInText(content, `"${property}":`) as number,
      },
    };
    return issue;
  }
}

export function scoreByErrorIssues(slug: string, issues): AuditOutput {
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

