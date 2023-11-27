import { Audit, AuditOutput, Issue } from '../../../../packages/models/src';
import { SourceResults } from './types';
import { displayValueNumPackages, scoreErrorIssues } from './utils';

const packageLicenseAuditSlug = 'package-license-check';
export const licenseAuditMeta: Audit = {
  slug: packageLicenseAuditSlug,
  title: 'License',
  description: 'A audit to check NPM package license`.',
};

export async function licenseAudit(
  packageJsonContents: SourceResults,
  license: string | null = null,
): Promise<AuditOutput> {
  const packageLicenseAuditOutput: AuditOutput = {
    slug: packageLicenseAuditSlug,
    score: 1,
    value: 0,
    displayValue: displayValueNumPackages(0),
  };

  if (!license) {
    return {
      ...packageLicenseAuditOutput,
      displayValue: `No license required`,
    };
  }

  const issues = packageJsonContents.map(({ file: file, json }) => {
    const issue: Issue = {
      message: `License is ${json.license}`,
      severity: 'info',
      source: {
        file,
      },
    };
    if (license !== json.license) {
      issue.severity = 'error';
      issue.message = `License should be ${license}. It is ${json.license}`;
    }
    return issue;
  });

  if (issues.length === 0) {
    return packageLicenseAuditOutput;
  }

  const errorCount = issues.filter(
    ({ severity }) => severity === 'error',
  ).length;
  return {
    ...packageLicenseAuditOutput,
    score: scoreErrorIssues(issues),
    value: errorCount,
    displayValue: displayValueNumPackages(errorCount),
    details: {
      issues,
    },
  };
}
