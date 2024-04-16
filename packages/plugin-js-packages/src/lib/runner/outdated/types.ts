export const versionType = ['major', 'minor', 'patch'] as const;
export type VersionType = (typeof versionType)[number];
export type PackageVersion = Record<VersionType, number>;
export type DependencyGroupLong =
  | 'dependencies'
  | 'devDependencies'
  | 'optionalDependencies';

// Unified Outdated result type
export type OutdatedResult = {
  name: string;
  current: string;
  latest: string;
  type: DependencyGroupLong;
  url?: string;
}[];
