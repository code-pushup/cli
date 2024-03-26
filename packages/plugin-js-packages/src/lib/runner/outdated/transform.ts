import { Issue } from '@code-pushup/models';
import { objectToEntries } from '@code-pushup/utils';
import { DependencyGroup } from '../../config';
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
  dependenciesType: DependencyGroup,
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
        : detail.type === `${dependenciesType}Dependencies`,
    );
  const outdatedDependencies = validDependencies.filter(
    ([, versions]) => versions.current !== versions.wanted,
  );

  const majorOutdatedAmount = outdatedDependencies.filter(
    ([, versions]) =>
      getOutdatedLevel(versions.current, versions.wanted) === 'major',
  ).length;

  const issues =
    outdatedDependencies.length === 0
      ? []
      : outdatedToIssues(outdatedDependencies);

  return {
    slug: `npm-outdated-${dependenciesType}`,
    score: calculateOutdatedScore(
      majorOutdatedAmount,
      validDependencies.length,
    ),
    value: outdatedDependencies.length,
    displayValue: outdatedToDisplayValue(
      majorOutdatedAmount,
      outdatedDependencies.length,
    ),
    ...(issues.length > 0 && { details: { issues } }),
  };
}

export function calculateOutdatedScore(
  majorOutdated: number,
  totalDeps: number,
) {
  return totalDeps > 0 ? (totalDeps - majorOutdated) / totalDeps : 1;
}

export function outdatedToDisplayValue(
  majorOutdated: number,
  totalOutdated: number,
) {
  return totalOutdated === 0
    ? 'all dependencies are up to date'
    : majorOutdated > 0
    ? `${majorOutdated} out of ${totalOutdated} outdated dependencies require major update`
    : `${totalOutdated} outdated ${
        totalOutdated === 1 ? 'dependency' : 'dependencies'
      }`;
}

export function outdatedToIssues(
  dependencies: NormalizedOutdatedEntries,
): Issue[] {
  return dependencies.map<Issue>(([name, versions]) => {
    const outdatedLevel = getOutdatedLevel(versions.current, versions.wanted);
    const packageReference =
      versions.homepage == null
        ? `\`${name}\``
        : `[\`${name}\`](${versions.homepage})`;

    return {
      message: `Package ${packageReference} requires a **${outdatedLevel}** update from **${versions.current}** to **${versions.wanted}**.`,
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
