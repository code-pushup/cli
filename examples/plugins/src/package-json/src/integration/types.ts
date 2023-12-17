export type DependencyType =
  | 'dependencies'
  | 'devDependencies'
  | 'optionalDependencies';

export type DependencyMap = {
  [key in DependencyType]?: Record<string, string>;
};

export type PackageJson = {
  license?: string;
  description?: string;
  type?: 'module' | 'commonjs';
} & DependencyMap;
export type SourceResult = { file: string; json: PackageJson; content: string };
export type SourceResults = SourceResult[];
