import type { AuditOutput, Issue } from '@code-pushup/models';
import type { PackageJson, SourceResult, SourceResults } from './types';
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
  description: 'An audit to check NPM package type.',
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

  const issues = packageJsonContents.map(({ file, json, content }): Issue => {
    // If type is undefined is defaults to 'commonjs'
    // https://nodejs.org/docs/latest-v13.x/api/esm.html#esm_package_json_type_field
    if (type === 'commonjs') {
      if (json.type === undefined) {
        return {
          message: 'Type is undefined. Defaults to commonjs.',
          severity: 'info',
        };
      } else if (type !== json.type) {
        return assertTypeNotCommonJS({ file, json, content }, type);
      }
    }

    if (json.type === ('' as unknown)) {
      return assertPropertyEmpty({ file, json, content }, 'type');
    }

    if (type !== json.type) {
      return assertPropertyEqual({ file, json, content }, 'type', type);
    }

    return {
      message: `Type is ${json.type}`,
      severity: 'info',
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

export function assertTypeNotCommonJS(
  result: SourceResult,
  value: unknown,
): Issue {
  const { json } = result;
  return {
    severity: 'error',
    message: `type should be undefined or ${value?.toString()} but is ${json.type?.toString()}`,
  };
}
