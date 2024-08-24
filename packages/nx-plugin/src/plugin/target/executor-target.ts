import { TargetConfiguration } from '@nx/devkit';
import { PACKAGE_NAME } from '../../internal/constants';
import { ProjectPrefixOptions } from '../types';

export function createExecutorTarget(options?: {
  bin?: string;
  projectPrefix?: string;
}): TargetConfiguration<ProjectPrefixOptions> {
  const { bin = PACKAGE_NAME, projectPrefix } = options ?? {};
  return {
    executor: `${bin}:command`,
    ...(projectPrefix
      ? {
          options: {
            projectPrefix,
          },
        }
      : {}),
  };
}
