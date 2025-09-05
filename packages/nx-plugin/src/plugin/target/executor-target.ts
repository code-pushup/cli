import type { TargetConfiguration } from '@nx/devkit';
import type { AutorunCommandExecutorOptions } from '../../executors/cli/schema.js';
import { PACKAGE_NAME } from '../../internal/constants.js';
import type { CreateNodesOptions } from '../types.js';

export function createExecutorTarget(
  options?: CreateNodesOptions,
): TargetConfiguration<AutorunCommandExecutorOptions> {
  const {
    pluginBin = PACKAGE_NAME,
    projectPrefix,
    cliBin,
    env,
  } = options ?? {};
  return {
    executor: `${pluginBin}:cli`,
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
