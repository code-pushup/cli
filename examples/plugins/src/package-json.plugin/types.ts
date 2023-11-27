import { RequiredDependencies } from './dependencies.audit';

export type PackageJson = {
  license?: string;
} & {
  description?: string;
} & {
  type?: 'module' | 'common';
} & RequiredDependencies;

export type SourceResult = { file: string; content: string; json: PackageJson };
export type SourceResults = SourceResult[];
