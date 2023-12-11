import { AuditOutput, Issue } from '@code-pushup/models';
import { PackageJson, SourceResults } from './types';
import {
  assertPropertyEmpty,
  assertPropertyEqual,
  baseAuditOutput,
  scoreByErrorIssues,
} from './utils';

const typeAuditSlug = 'package-type';
export const typeAuditInfoMeta = {
  slug: typeAuditSlug,
  title: 'Type',
  description: 'A audit to check NPM package type`.',
};

export function typeAudit(
  packageJsonContents: SourceResults,
  type: PackageJson['type'] = undefined,
): AuditOutput {
  const typeAuditOutput: AuditOutput = baseAuditOutput(typeAuditSlug);

  if (!type) {
    return {
      ...typeAuditOutput,
      displayValue: `No type required`,
    };
  }

  const issues: Issue[] = packageJsonContents.map(({ file, json, content }) => {
    if (type === '' as unknown) {
      return assertPropertyEmpty({ file, json, content }, 'type', type);
    }

    if (type !== json.type) {
      return assertPropertyEqual({ file, json, content }, 'type', type);
    }

    return {
      message: `Type is ${json.type}`,
      severity: 'info',
      source: {
        file,
      },
    };
  });

  if (issues.length === 0) {
    return {
      ...typeAuditOutput,
      details: {
        issues,
      },
    };
  }

  return scoreByErrorIssues(typeAuditOutput.slug, issues);
}
