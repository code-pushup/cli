import { Issue } from '@code-pushup/models';
import { objectToEntries, pluralize } from '@code-pushup/utils';
import { PackageDependency } from '../../config';
import { outdatedSeverity } from './constants';
import {
  NormalizedOutdatedEntries,
  NormalizedVersionOverview,
  NpmOutdatedResultJson,
  PackageVersion,
  VersionType,
} from './types';

export function outdatedResultToAuditOutput(
  result: NpmOutdatedResultJson,
  dependenciesType: PackageDependency,
) {
  // current might be missing in some cases
  // https://stackoverflow.com/questions/42267101/npm-outdated-command-shows-missing-in-current-version
  const validDependencies: NormalizedOutdatedEntries = objectToEntries(result)
    .filter(
      (entry): entry is [string, NormalizedVersionOverview] =>
        entry[1].current != null,
    )
    .filter(([, detail]) =>
      dependenciesType === 'prod'
        ? detail.type === 'dependencies'
        : detail.type.startsWith(dependenciesType),
    );
  const outdatedDependencies = validDependencies.filter(
    ([, versions]) => versions.current !== versions.wanted,
  );

  const issues =
    outdatedDependencies.length === 0
      ? []
      : outdatedToIssues(outdatedDependencies);

  return {
    slug: `npm-outdated-${dependenciesType}`,
    score: outdatedDependencies.length === 0 ? 1 : 0,
    value: outdatedDependencies.length,
    displayValue: outdatedToDisplayValue(outdatedDependencies.length),
    ...(issues.length > 0 && { details: { issues } }),
  };
}

function outdatedToDisplayValue(outdatedDeps: number) {
  return outdatedDeps === 0
    ? 'passed'
    : `${outdatedDeps} outdated ${
        outdatedDeps === 1 ? 'dependency' : pluralize('dependency')
      }`;
}

export function outdatedToIssues(
  dependencies: NormalizedOutdatedEntries,
): Issue[] {
  return dependencies.map<Issue>(([name, versions]) => {
    const outdatedLevel = getOutdatedLevel(versions.current, versions.wanted);
    const packageDocumentation =
      versions.homepage == null
        ? ''
        : ` Package documentation [here](${versions.homepage})`;

    return {
      message: `Package ${name} requires a ${outdatedLevel} update from **${versions.current}** to **${versions.wanted}**.${packageDocumentation}`,
      severity: outdatedSeverity[outdatedLevel],
    };
  });
}

export function getOutdatedLevel(
  currentFullVersion: string,
  wantedFullVersion: string,
): VersionType {
  const current = splitPackageVersion(currentFullVersion);
  const wanted = splitPackageVersion(wantedFullVersion);

  if (current.major < wanted.major) {
    return 'major';
  }

  if (current.minor < wanted.minor) {
    return 'minor';
  }

  if (current.patch < wanted.patch) {
    return 'patch';
  }

  throw new Error('Package is not outdated.');
}

export function splitPackageVersion(fullVersion: string): PackageVersion {
  const [major, minor, patch] = fullVersion.split('.').map(Number);

  if (major == null || minor == null || patch == null) {
    throw new Error(`Invalid version description ${fullVersion}`);
  }

  return { major, minor, patch };
}
