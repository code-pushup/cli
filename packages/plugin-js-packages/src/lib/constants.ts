import { IssueSeverity } from '@code-pushup/models';
import type { DependencyGroup, PackageAuditLevel } from './config';
import { DependencyGroupLong } from './runner/outdated/types';

export const defaultAuditLevelMapping: Record<
  PackageAuditLevel,
  IssueSeverity
> = {
  critical: 'error',
  high: 'error',
  moderate: 'warning',
  low: 'warning',
  info: 'info',
};

export const dependencyGroupToLong: Record<
  DependencyGroup,
  DependencyGroupLong
> = {
  prod: 'dependencies',
  dev: 'devDependencies',
  optional: 'optionalDependencies',
};

export const dependencyGroupWeights: Record<DependencyGroup, number> = {
  // eslint-disable-next-line no-magic-numbers
  prod: 3,
  dev: 1,
  optional: 1,
};

export const dependencyDocs: Record<DependencyGroup, string> = {
  prod: 'https://classic.yarnpkg.com/docs/dependency-types#toc-dependencies',
  dev: 'https://classic.yarnpkg.com/docs/dependency-types#toc-devdependencies',
  optional:
    'https://classic.yarnpkg.com/docs/dependency-types#toc-optionaldependencies',
};
