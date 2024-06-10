import type { ReleaseType } from 'semver';

export type PackageVersion = Record<ReleaseType, number>;
export const dependencyGroupLong = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
] as const;
export type DependencyGroupLong = (typeof dependencyGroupLong)[number];

type PackageJsonDependencies = Record<string, string>;
export type PackageJson = Partial<
  Record<DependencyGroupLong, PackageJsonDependencies>
>;

// Unified Outdated result type
export type OutdatedDependency = {
  name: string;
  current: string;
  latest: string;
  type: DependencyGroupLong;
  url?: string;
};

export type OutdatedResult = OutdatedDependency[];
