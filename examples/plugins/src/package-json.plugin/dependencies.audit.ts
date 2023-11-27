import { Audit, AuditOutput, Issue } from '../../../../packages/models/src';
import { PackageJson, SourceResult, SourceResults } from './types';
import { displayValueNumPackages, findLineNumberInText } from './utils';

export type DependencyTypes =
  | 'dependencies'
  | 'devDependencies'
  | 'optionalDependencies';
export type RequiredDependencies = {
  [key in DependencyTypes]?: Record<string, string>;
};

const dependenciesAuditSlug = 'package-version-check';
export const dependenciesAuditMeta: Audit = {
  slug: dependenciesAuditSlug,
  title: 'Dependencies',
  description: 'A audit to check NPM package versions`.',
};
/*
export async function depsFromTarget(filePath: string, deps: RequiredDependencies): Promise<RequiredDependencies> {
  const {
    dependencies,
    devDependencies,
    optionalDependencies
  } = await readJsonFile<Record<DependencyTypes, Record<string, string>>>(filePath);

  const newDeps: Record<DependencyTypes, Record<string, string>> = {} as Record<DependencyTypes, Record<string, string>>;
  // iterate over each deps and create new object with only the deps that are in the target
  Object.entries(deps).forEach(([depType, depMap]) => {
    const newDepMap = {} as Record<string, string>;
    Object.entries(depMap).forEach(([depName, depVersion]) => {
      if (depName in dependencies) {
        newDepMap[depName] = depVersion;
      }
    });
    newDeps[depType as DependencyTypes] = newDepMap;
  })

  return {dependencies, devDependencies, optionalDependencies};
}
*/
export function scoreAudit(issues: number, errors: number): number {
  if (issues < errors) {
    throw new Error(`issues: ${issues} cannot be less than errors ${errors}`);
  }
  issues = Math.max(issues, 0);
  errors = Math.max(errors, 0);
  return errors > 0 ? Math.abs((issues - errors) / issues) : 1;
}

export async function dependenciesAudit(
  packageResults: SourceResults,
  requiredDependencies: RequiredDependencies = {},
): Promise<AuditOutput> {
  const packageVersionsAuditOutput: AuditOutput = {
    slug: dependenciesAuditSlug,
    score: 1,
    value: 0,
    displayValue: displayValueNumPackages(0),
  };

  const issues = await dependenciesIssues(requiredDependencies, packageResults);

  // early exit if no issues
  if (!issues.length) {
    return packageVersionsAuditOutput;
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  return {
    ...packageVersionsAuditOutput,
    score: scoreAudit(issues.length, errorCount),
    value: errorCount,
    displayValue: displayValueNumPackages(errorCount),
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
