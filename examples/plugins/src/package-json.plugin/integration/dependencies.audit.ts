import { findLineNumberInText } from '../../../../../dist/packages/utils/src';
import { Audit, AuditOutput, Issue } from '../../../../../packages/models/src';
import { factorOf } from '../../../../../packages/utils/src';
import {
  DependencyMap,
  DependencyTypes,
  PackageJson,
  SourceResult,
  SourceResults,
} from './types';
import { filterSeverityError, pluralizePackage } from './utils';

export type RequiredDependencies = DependencyMap;

const dependenciesAuditSlug = 'package-dependencies';
export const dependenciesAuditMeta: Audit = {
  slug: dependenciesAuditSlug,
  title: 'Dependencies',
  description: 'A audit to check NPM package versions`.',
};

export async function dependenciesAudit(
  packageResults: SourceResults,
  requiredDependencies: RequiredDependencies = {},
): Promise<AuditOutput> {
  const packageVersionsAuditOutput: AuditOutput = {
    slug: dependenciesAuditSlug,
    score: 1,
    value: 0,
    displayValue: pluralizePackage(),
  };

  const issues = await dependenciesIssues(requiredDependencies, packageResults);

  // early exit if no issues
  if (!issues.length) {
    return packageVersionsAuditOutput;
  }

  const errorCount = issues.filter(filterSeverityError).length;
  return {
    ...packageVersionsAuditOutput,
    score: factorOf(issues, filterSeverityError),
    value: errorCount,
    displayValue: pluralizePackage(errorCount),
    details: {
      issues,
    },
  };
}

export async function dependenciesIssues(
  requiredDependencies: RequiredDependencies,
  packageResults: SourceResults,
): Promise<Issue[]> {
  return packageResults.flatMap(packageResult => {
    // iterate dependency types to check
    return (
      Object.entries(requiredDependencies)
        // filter for relevant dependency types
        .filter(
          ([dependencyTypes]) =>
            packageResult.json[dependencyTypes as unknown as DependencyTypes],
        )
        // iterate over each dependency type
        .flatMap(([type, requiredDependencies]) => {
          const dependencyType = type as DependencyTypes;
          const existingDependencies = packageResult.json[
            dependencyType
          ] as Record<string, string>;
          // iterate over each required dependency and check if it is installed
          return Object.entries(requiredDependencies).map(
            requiredDependency => {
              // package in dependencies
              if (existingDependencies[requiredDependency[0]] !== undefined) {
                return assertDependency(
                  packageResult,
                  requiredDependency,
                  dependencyType,
                );
              }
              return packageNotInstalledIssue(
                packageResult,
                requiredDependency,
              );
            },
          );
        })
    );
  });
}

export function packageNotInstalledIssue(
  packageResult: Pick<SourceResult, 'file'>,
  requiredDependency: [string, string],
): Issue {
  const { file } = packageResult || {};
  const [packageName, targetVersion] = requiredDependency || [];
  return {
    message: `Package ${packageName} is not installed. Run \`npm install ${packageName}@${targetVersion}\` to install it.`,
    severity: 'error',
    source: {
      file,
    },
  };
}

export function assertDependency(
  packageResult: SourceResult,
  requiredDependency: [string, string],
  dependencyType: DependencyTypes,
) {
  const {
    file = '',
    json = {} as PackageJson,
    content = '',
  } = packageResult || {};
  const [packageName, targetVersion] = requiredDependency || [];

  const issue: Issue = {
    message: `Package ${packageName}@${targetVersion} is installed as ${dependencyType}.`,
    severity: 'info',
    source: {
      file,
    },
  };

  const existingVersion = json[dependencyType]?.[packageName];
  if (targetVersion !== existingVersion) {
    issue.severity = 'error';
    issue.message = `Package ${packageName} in ${dependencyType} has wrong version. Wanted ${targetVersion} but got ${existingVersion}`;
    issue.source = {
      file,
      position: {
        startLine: findLineNumberInText(content, `"${packageName}":`) as number,
      },
    };
  }

  return issue;
}
