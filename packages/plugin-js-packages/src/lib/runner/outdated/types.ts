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

// Subset of NPM outdated JSON type
export type NpmVersionOverview = {
  current?: string;
  latest: string;
  type: DependencyGroupLong;
  homepage?: string;
};

export type NpmNormalizedOverview = Omit<NpmVersionOverview, 'current'> & {
  current: string;
};

export type NpmOutdatedResultJson = Record<string, NpmVersionOverview>;

// Subset of Yarn v1 outdated JSON type
export type Yarnv1VersionOverview = [
  string, // package
  string, // current
  string, // wanted
  string, // latest
  string, // workspace
  DependencyGroupLong, // package type
  string, // URL
];

type Yarnv1Info = { type: 'info' };
type Yarnv1Table = {
  type: 'table';
  data: {
    body: Yarnv1VersionOverview[];
  };
};

export type Yarnv1OutdatedResultJson = [Yarnv1Info, Yarnv1Table];

// Subset of Yarn v2 outdated JSON type
export type Yarnv2VersionOverview = {
  current: string;
  latest: string;
  name: string;
  type: DependencyGroupLong;
};

export type Yarnv2OutdatedResultJson = Yarnv2VersionOverview[];

// Subset of PNPM outdated JSON type
export type PnpmVersionOverview = {
  current: string;
  latest: string;
  dependencyType: DependencyGroupLong;
};
export type PnpmOutdatedResultJson = Record<string, PnpmVersionOverview>;
