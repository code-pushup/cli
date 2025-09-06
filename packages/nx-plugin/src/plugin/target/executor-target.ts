import type { TargetConfiguration } from '@nx/devkit';
import type { AutorunCommandExecutorOptions } from '../../executors/cli/schema.js';
import { PACKAGE_NAME } from '../../internal/constants.js';
import type { CreateNodesOptions } from '../types.js';

export function createExecutorTarget(
  options?: CreateNodesOptions,
): TargetConfiguration<AutorunCommandExecutorOptions> {
  const { projectPrefix, cliBin, env } = options ?? {};
  return {
    executor: `${PACKAGE_NAME}:cli`,
    ...(cliBin || projectPrefix || env
      ? {
          options: {
            ...(cliBin ? { bin: cliBin } : {}),
            ...(projectPrefix ? { projectPrefix } : {}),
            ...(env ? { env } : {}),
          },
        }
      : {}),
  };
}
