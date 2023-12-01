import {
  FileResult,
  factorOf,
  findLineNumberInText,
  pluralizeToken,
} from '../../../../dist/packages/utils';
import { AuditOutput, Issue } from '../../../../packages/models/src';
import { SourceResults } from './types';
import { filterSeverityError } from './utils';

const documentationAuditSlug = 'package-documentation';
export const documentationAuditMeta = {
  slug: documentationAuditSlug,
  title: 'Documentation',
  description: 'A audit to check NPM package documentation`.',
};

export type DocumentationOptions = { description?: boolean };

export async function documentationAudit(
  packageJsonContents: SourceResults,
  documentation: DocumentationOptions = {},
): Promise<AuditOutput> {
  const documentationAuditOutput: AuditOutput = {
    slug: documentationAuditSlug,
    score: 1,
    value: 0,
    displayValue: pluralizeToken('package'),
  };

  if (!Object.keys(documentation).length) {
    return {
      ...documentationAuditOutput,
      displayValue: `No documentation requirements`,
    };
  }

  const issues = packageJsonContents.flatMap(({ file, json, content }) => {
    return Object.entries(documentation).map(([key, value]) => {
      const issue: Issue = {
        message: 'Description OK',
        severity: 'info',
        source: {
          file,
        },
      };
      if (key === 'description' && value) {
        if (json.description === undefined) {
          issue.severity = 'error';
          issue.message = 'Description missing';
        }
        if (json.description === '') {
          issue.severity = 'error';
          issue.message = `Description empty`;
          issue.source = {
            file,
            position: {
              startLine: findLineNumberInText(
                content,
                '"description":',
              ) as number,
            },
          };
        }
      }
      return issue;
    });
  });

  if (issues.length === 0) {
    return documentationAuditOutput;
  }

  const errorCount = issues.filter(filterSeverityError).length;
  return {
    ...documentationAuditOutput,
    value: errorCount,
    displayValue: pluralizeToken('package', errorCount),
    score: factorOf(issues, filterSeverityError),
    details: {
      issues,
    },
  };
}
