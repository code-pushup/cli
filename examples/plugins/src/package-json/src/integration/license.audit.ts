import type { Audit, AuditOutput, Issue } from '@code-pushup/models';
import type { SourceResults } from './types';
import {
  assertPropertyEmpty,
  assertPropertyEqual,
  baseAuditOutput,
  scoreByErrorIssues,
} from './utils';

const licenseAuditSlug = 'package-license';
export const licenseAuditMeta: Audit = {
  slug: licenseAuditSlug,
  title: 'License',
  description: 'An audit to check NPM package license.',
};

export function licenseAudit(
  packageJsonContents: SourceResults,
  license: string | null = null,
): AuditOutput {
  const packageLicenseAuditOutput: AuditOutput =
    baseAuditOutput(licenseAuditSlug);

  if (!license) {
    return {
      ...packageLicenseAuditOutput,
      displayValue: `No license required`,
    };
  }

  const issues: Issue[] = packageJsonContents.map(({ file, json, content }) => {
    if (!license || license === '') {
      return assertPropertyEmpty({ file, json, content }, 'license');
    }
    if (license !== json.license) {
      return assertPropertyEqual({ file, json, content }, 'license', license);
    }

    return {
      message: `License is ${json.license}`,
      severity: 'info',
    };
  });

  if (issues.length === 0) {
    return {
      ...packageLicenseAuditOutput,
      details: {
        issues,
      },
    };
  }

  return scoreByErrorIssues(packageLicenseAuditOutput.slug, issues);
}
