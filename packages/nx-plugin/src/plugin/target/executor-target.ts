import type { TargetConfiguration } from '@nx/devkit';
import { PACKAGE_NAME } from '../../internal/constants.js';
import type { ProjectPrefixOptions } from '../types.js';

export function createExecutorTarget(options?: {
  bin?: string;
  projectPrefix?: string;
}): TargetConfiguration<ProjectPrefixOptions> {
  const { bin = PACKAGE_NAME, projectPrefix } = options ?? {};
  return {
    executor: `${bin}:cli`,
    ...(projectPrefix
      ? {
          options: {
            projectPrefix,
          },
        }
      : {}),
  };
}
