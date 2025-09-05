import type { TargetConfiguration } from '@nx/devkit';
import type { AutorunCommandExecutorOptions } from '../../executors/cli/schema.js';
import { PACKAGE_NAME } from '../../internal/constants.js';
import { parseAutorunExecutorOptions } from '../../internal/options.js';
import type { ProjectPrefixOptions } from '../types.js';

export function createExecutorTarget(
  options?: {
    pluginBin?: string;
  } & AutorunCommandExecutorOptions,
): TargetConfiguration<ProjectPrefixOptions & AutorunCommandExecutorOptions> {
  const { pluginBin = PACKAGE_NAME, ...opts } = options ?? {};
  return {
    executor: `${pluginBin}:cli`,
    outputs: [`{options.persist.outputDir}/report.*`],
    options: parseAutorunExecutorOptions(opts),
  };
}
