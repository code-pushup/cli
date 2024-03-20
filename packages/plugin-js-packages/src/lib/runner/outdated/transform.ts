import { Issue } from '@code-pushup/models';
import { pluralize } from '@code-pushup/utils';
import { DependencyGroup } from '../../config';
import { outdatedSeverity } from './constants';
import {
  OutdatedResult,
  PackageVersion,
  VersionType,
  versionType,
} from './types';

export function outdatedResultToAuditOutput(
  result: OutdatedResult,
  dependencyGroup: DependencyGroup,
) {
  // current might be missing in some cases
  // https://stackoverflow.com/questions/42267101/npm-outdated-command-shows-missing-in-current-version
  const relevantDependencies: OutdatedResult = result.filter(dep =>
    dependencyGroup === 'prod'
      ? dep.type === 'dependencies'
      : dep.type === `${dependencyGroup}Dependencies`,
  );
  const outdatedDependencies = relevantDependencies.filter(
    dep => dep.current !== dep.wanted,
  );

  const outdatedStats = outdatedDependencies.reduce(
    (acc, dep) => {
      const outdatedLevel = getOutdatedLevel(dep.current, dep.wanted);
      return { ...acc, [outdatedLevel]: acc[outdatedLevel] + 1 };
    },
    { major: 0, minor: 0, patch: 0 },
  );

  const issues =
    outdatedDependencies.length === 0
      ? []
      : outdatedToIssues(outdatedDependencies);

  return {
    slug: `npm-outdated-${dependencyGroup}`,
    score: calculateOutdatedScore(
      outdatedStats.major,
      relevantDependencies.length,
    ),
    value: outdatedDependencies.length,
    displayValue: outdatedToDisplayValue(outdatedStats),
    ...(issues.length > 0 && { details: { issues } }),
  };
}

export function calculateOutdatedScore(
  majorOutdated: number,
  totalDeps: number,
) {
  return totalDeps > 0 ? (totalDeps - majorOutdated) / totalDeps : 1;
}

export function outdatedToDisplayValue(stats: Record<VersionType, number>) {
  const total = stats.major + stats.minor + stats.patch;

  const versionBreakdown = versionType
    .map(version => (stats[version] > 0 ? `${stats[version]} ${version}` : ''))
    .filter(text => text !== '');

  if (versionBreakdown.length === 0) {
    return 'all dependencies are up to date';
  }

  if (versionBreakdown.length > 1) {
    return `${total} outdated package versions (${versionBreakdown.join(
      ', ',
    )})`;
  }

  return `${versionBreakdown[0]} outdated package ${pluralize(
    'version',
    total,
  )}`;
}

export function outdatedToIssues(dependencies: OutdatedResult): Issue[] {
  return dependencies.map<Issue>(dep => {
    const { name, current, wanted, url, project } = dep;
    const outdatedLevel = getOutdatedLevel(current, wanted);
    const packageReference =
      url == null ? `\`${name}\`` : `[\`${name}\`](${url})`;

    return {
      message: `${project}'s dependency ${packageReference} requires a **${outdatedLevel}** update from **${current}** to **${wanted}**.`,
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
