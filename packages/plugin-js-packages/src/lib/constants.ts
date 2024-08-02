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

/* eslint-disable no-magic-numbers */
export const dependencyGroupWeights: Record<DependencyGroup, number> = {
  prod: 80,
  dev: 15,
  optional: 5,
};
/* eslint-enable no-magic-numbers */

export const dependencyDocs: Record<DependencyGroup, string> = {
  prod: 'https://classic.yarnpkg.com/docs/dependency-types#toc-dependencies',
  dev: 'https://classic.yarnpkg.com/docs/dependency-types#toc-devdependencies',
  optional:
    'https://classic.yarnpkg.com/docs/dependency-types#toc-optionaldependencies',
};
