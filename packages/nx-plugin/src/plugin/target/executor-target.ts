import type { TargetConfiguration } from '@nx/devkit';
import { PACKAGE_NAME } from '../../internal/constants.js';
import type { ProjectPrefixOptions } from '../types.js';

export function createExecutorTarget(options?: {
  bin?: string;
  projectPrefix?: string;
  env?: Record<string, string>;
}): TargetConfiguration<
  ProjectPrefixOptions & { env?: Record<string, string> }
> {
  const { bin, projectPrefix, env } = options ?? {};

  const executor = `${PACKAGE_NAME}:cli`;
  const executorOptions = (bin || projectPrefix || env) && {
    ...(bin && { bin }),
    ...(projectPrefix && { projectPrefix }),
    ...(env && { env }),
  };
  return { executor, ...(executorOptions && { options: executorOptions }) };
}
