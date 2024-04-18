import type { ReleaseType } from 'semver';

export type PackageVersion = Record<ReleaseType, number>;
export type DependencyGroupLong =
  | 'dependencies'
  | 'devDependencies'
  | 'optionalDependencies';

// Unified Outdated result type
export type OutdatedDependency = {
  name: string;
  current: string;
  latest: string;
  type: DependencyGroupLong;
  url?: string;
};

export type OutdatedResult = OutdatedDependency[];
