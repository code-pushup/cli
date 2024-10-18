import { md } from 'build-md';
import { type ReleaseType, clean, diff, neq } from 'semver';
import type { AuditOutput, Issue } from '@code-pushup/models';
import { objectFromEntries, pluralize } from '@code-pushup/utils';
import type { DependencyGroup, PackageManagerId } from '../../config';
import { dependencyGroupToLong } from '../../constants';
import { RELEASE_TYPES, outdatedSeverity } from './constants';
import type { OutdatedResult } from './types';

export function outdatedResultToAuditOutput(
  result: OutdatedResult,
  packageManager: PackageManagerId,
  depGroup: DependencyGroup,
  totalDeps: number,
): AuditOutput {
  const relevantDependencies: OutdatedResult = result.filter(
    dep => dep.type === dependencyGroupToLong[depGroup],
  );

  const validDependencies = relevantDependencies
    .map(dep => ({
      ...dep,
      current: clean(dep.current),
      latest: clean(dep.latest),
    }))
    .filter(
      (dep): dep is OutdatedResult[number] =>
        dep.current != null && dep.latest != null,
    );

  const outdatedDependencies = validDependencies.filter(dep =>
    neq(dep.current, dep.latest),
  );

  const outdatedStats = outdatedDependencies.reduce(
    (acc, dep) => {
      const outdatedLevel = diff(dep.current, dep.latest);
      if (outdatedLevel == null) {
        return acc;
      }
      return { ...acc, [outdatedLevel]: acc[outdatedLevel] + 1 };
    },
    objectFromEntries(RELEASE_TYPES.map(versionType => [versionType, 0])),
  );

  const issues =
    outdatedDependencies.length === 0
      ? []
      : outdatedToIssues(outdatedDependencies);

  return {
    slug: `${packageManager}-outdated-${depGroup}`,
    score: calculateOutdatedScore(outdatedStats.major, totalDeps),
    value: outdatedDependencies.length,
    displayValue: outdatedToDisplayValue(outdatedStats),
    details: { issues },
  };
}

export function calculateOutdatedScore(
  majorOutdated: number,
  totalDeps: number,
) {
  return totalDeps > 0 ? (totalDeps - majorOutdated) / totalDeps : 1;
}

export function outdatedToDisplayValue(stats: Record<ReleaseType, number>) {
  const total = Object.values(stats).reduce((acc, value) => acc + value, 0);

  const versionBreakdown = RELEASE_TYPES.map(version =>
    stats[version] > 0 ? `${stats[version]} ${version}` : '',
  ).filter(text => text !== '');

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
    const { name, current, latest, url } = dep;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outdatedLevel = diff(current, latest)!;
    const packageReference =
      url == null ? md.code(name) : md.link(url, md.code(name));

    return {
      message: md`Package ${packageReference} requires a ${md.bold(
        outdatedLevel,
      )} update from ${md.bold(current)} to ${md.bold(latest)}.`.toString(),
      severity: outdatedSeverity[outdatedLevel],
    };
  });
}
