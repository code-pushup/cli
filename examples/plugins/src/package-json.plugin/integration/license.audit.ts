import {
  factorOf,
} from '../../../../../dist/packages/utils/src';
import { Audit, AuditOutput, Issue } from '../../../../../packages/models/src';
import { SourceResults } from './types';
import {
  assertPropertyEqual, baseAuditOutput,
  filterSeverityError,
  pluralizePackage,
} from './utils';

const packageLicenseAuditSlug = 'package-license';
export const licenseAuditMeta: Audit = {
  slug: packageLicenseAuditSlug,
  title: 'License',
  description: 'A audit to check NPM package license`.',
};

export async function licenseAudit(
  packageJsonContents: SourceResults,
  license: string | null = null,
): Promise<AuditOutput> {
  const packageLicenseAuditOutput: AuditOutput = baseAuditOutput(packageLicenseAuditSlug);

  if (!license) {
    return {
      ...packageLicenseAuditOutput,
      displayValue: `No license required`,
    };
  }

  const issues = packageJsonContents.map(({ file, json, content }) => {
    const issue: Issue = {
      message: `License is ${json.license}`,
      severity: 'info',
      source: {
        file,
      },
    };
    if (license !== json.license) {
      return assertPropertyEqual({ file, json, content }, 'license', license);
    }
    return issue;
  });

  if (issues.length === 0) {
    return packageLicenseAuditOutput;
  }
  return scoreByErrorIssues('', issues);
}
