import type { IssueSeverity } from '@code-pushup/models';
import type { DependencyGroup, PackageAuditLevel } from './config.js';
import type { DependencyGroupLong } from './runner/outdated/types.js';

export const JS_PACKAGES_PLUGIN_SLUG = 'js-packages';
export const JS_PACKAGES_PLUGIN_TITLE = 'JS packages';

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
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  prod: 80,
  dev: 15,
  optional: 5,
  /* eslint-enable @typescript-eslint/no-magic-numbers */
};

export const dependencyDocs: Record<DependencyGroup, string> = {
  prod: 'https://classic.yarnpkg.com/docs/dependency-types#toc-dependencies',
  dev: 'https://classic.yarnpkg.com/docs/dependency-types#toc-devdependencies',
  optional:
    'https://classic.yarnpkg.com/docs/dependency-types#toc-optionaldependencies',
};
