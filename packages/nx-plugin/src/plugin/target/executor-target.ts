import type { TargetConfiguration } from '@nx/devkit';
import { PACKAGE_NAME } from '../../internal/constants.js';
import type { ProjectPrefixOptions } from '../types.js';

export function createExecutorTarget(options?: {
  bin?: string;
  projectPrefix?: string;
}): TargetConfiguration<ProjectPrefixOptions> {
  const { bin, projectPrefix } = options ?? {};

  const executor = `${PACKAGE_NAME}:cli`;
  const options = (bin || projectPrefix) && {    
    ...(bin && { bin }),
    ...(projectPrefix && { projectPrefix }),
  };
  return { executor, ...(options && { options })};
}
