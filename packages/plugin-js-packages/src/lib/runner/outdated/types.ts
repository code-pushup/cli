// Subset of NPM outdated JSON type
export const versionType = ['major', 'minor', 'patch'] as const;
export type VersionType = (typeof versionType)[number];
export type PackageVersion = Record<VersionType, number>;
export type DependencyGroupLong =
  | 'dependencies'
  | 'devDependencies'
  | 'optionalDependencies';

export type VersionOverview = {
  current?: string;
  wanted: string;
  type: DependencyGroupLong;
  dependent: string;
  homepage?: string;
};

export type NormalizedVersionOverview = Omit<VersionOverview, 'current'> & {
  current: string;
};
export type NormalizedOutdatedEntries = [string, NormalizedVersionOverview][];

export type NpmOutdatedResultJson = {
  [key: string]: VersionOverview;
};

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

export type Yarnv1OutdatedResultJson = {
  data: {
    body: Yarnv1VersionOverview[];
  };
};

// Unified Outdated result type
export type OutdatedResult = {
  name: string;
  current: string;
  wanted: string;
  type: DependencyGroupLong;
  project: string;
  url?: string;
}[];
