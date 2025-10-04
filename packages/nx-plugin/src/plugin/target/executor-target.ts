import type { TargetConfiguration } from '@nx/devkit';
import { PACKAGE_NAME } from '../../internal/constants.js';
import type { ProjectPrefixOptions } from '../types.js';

export function createExecutorTarget(options?: {
  bin?: string;
  projectPrefix?: string;
}): TargetConfiguration<ProjectPrefixOptions> {
  const { bin, projectPrefix } = options ?? {};

  return {
    executor: `${PACKAGE_NAME}:cli`,
    options: {
      ...(bin ? { bin } : {}),
      ...(projectPrefix ? { projectPrefix } : {}),
    },
  };
}
