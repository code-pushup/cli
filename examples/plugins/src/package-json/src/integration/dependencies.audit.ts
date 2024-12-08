import type { Audit, AuditOutput, Issue } from '@code-pushup/models';
import { factorOf } from '@code-pushup/utils';
import type {
  DependencyMap,
  DependencyType,
  SourceResult,
  SourceResults,
} from './types.js';
import { filterSeverityError, pluralizePackage } from './utils.js';

export type RequiredDependencies = DependencyMap;

const dependenciesAuditSlug = 'package-dependencies';
export const dependenciesAuditMeta: Audit = {
  slug: dependenciesAuditSlug,
  title: 'Dependencies',
  description: 'An audit to check NPM package versions.',
};

export function dependenciesAudit(
  packageResults: SourceResults,
  requiredDependencies: RequiredDependencies = {},
): AuditOutput {
  const packageVersionsAuditOutput: AuditOutput = {
    slug: dependenciesAuditSlug,
    score: 1,
    value: 0,
    displayValue: pluralizePackage(),
  };

  if (Object.keys(requiredDependencies).length === 0) {
    return {
      ...packageVersionsAuditOutput,
      displayValue: `No dependencies required`,
    };
  }

  const issues = dependenciesIssues(requiredDependencies, packageResults);

  // early exit if no issues
  if (issues.length === 0) {
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

export function dependenciesIssues(
  requiredDependencies: RequiredDependencies,
  packageResults: SourceResults,
): Issue[] {
  return packageResults.flatMap((packageResult: SourceResult) =>
    Object.entries(requiredDependencies).flatMap(
      ([dependencyType, dependencies]) => {
        const existingDependencies: Record<string, string> = ((
          packageResult.json as Record<string, string>
        )[dependencyType] || {}) as Record<string, string>;

        // Map over each required dependency and check if it exists
        return Object.entries(dependencies).map(
          ([dependencyName, requiredVersion]) => {
            const existingVersion: string | undefined =
              existingDependencies[dependencyName];

            // Generate the appropriate issue based on whether the dependency exists
            return existingVersion === undefined
              ? packageNotInstalledIssue(
                  [dependencyName, requiredVersion],
                  dependencyType as DependencyType,
                )
              : assertDependency(
                  packageResult,
                  [dependencyName, requiredVersion],
                  dependencyType as DependencyType,
                );
          },
        );
      },
    ),
  );
}

export function packageNotInstalledIssue(
  requiredDependency: [string, string],
  dependencyType: DependencyType,
): Issue {
  const [packageName, targetVersion] = requiredDependency;
  return {
    message: `Package ${packageName} is not installed under ${dependencyType}. Run \`npm install ${packageName}@${targetVersion}\` to install it.`,
    severity: 'error',
  };
}

export function assertDependency(
  packageResult: SourceResult,
  requiredDependency: [string, string],
  dependencyType: DependencyType,
): Issue {
  const { json = {} } = packageResult;
  const [packageName, targetVersion] = requiredDependency;

  const existingVersion = json[dependencyType]?.[packageName];
  if (targetVersion !== existingVersion) {
    return {
      severity: 'error',
      message: `Package ${packageName} in ${dependencyType} has wrong version. Wanted ${targetVersion} but got ${existingVersion}`,
    };
  }

  return {
    message: `Package ${packageName}@${targetVersion} is installed as ${dependencyType}.`,
    severity: 'info',
  };
}
