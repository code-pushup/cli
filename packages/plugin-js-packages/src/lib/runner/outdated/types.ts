// Subset of NPM outdated JSON type

export type VersionType = 'major' | 'minor' | 'patch';
export type PackageVersion = Record<VersionType, number>;

export type VersionOverview = {
  current?: string;
  wanted: string;
  type: 'dependencies' | 'devDependencies' | 'optionalDependencies';
  homepage?: string;
};

export type NormalizedVersionOverview = Omit<VersionOverview, 'current'> & {
  current: string;
};
export type NormalizedOutdatedEntries = [string, NormalizedVersionOverview][];

export type NpmOutdatedResultJson = {
  [key: string]: VersionOverview;
};
