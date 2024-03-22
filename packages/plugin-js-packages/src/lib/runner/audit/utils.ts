import {
  DependencyGroup,
  PackageManager,
  dependencyGroups,
} from '../../config';
import { dependencyGroupToLong } from '../../constants';

function getNpmDepOptions(currentDep: DependencyGroup) {
  return dependencyGroups.map(dep =>
    dep === currentDep ? `--include=${dep}` : `--omit=${dep}`,
  );
}

export const auditArgs = (
  groupDep: DependencyGroup,
): Record<PackageManager, string[]> => ({
  npm: [...getNpmDepOptions(groupDep), '--json', '--audit-level=none'],
  'yarn-classic': [`--groups ${dependencyGroupToLong[groupDep]}`],
  'yarn-modern': [],
  pnpm: [],
});
