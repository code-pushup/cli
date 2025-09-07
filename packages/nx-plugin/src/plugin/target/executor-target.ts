import type { TargetConfiguration } from '@nx/devkit';
import type { CliExecutorOptions } from '../../executors/cli/schema.js';
import { PACKAGE_NAME } from '../../internal/constants.js';
import { parseCliExecutorOptions } from '../../internal/options.js';
import type { ProjectPrefixOptions } from '../types.js';

export function createExecutorTarget(
  options?: {
    pluginBin?: string;
  } & CliExecutorOptions,
): TargetConfiguration<ProjectPrefixOptions & CliExecutorOptions> {
  const { pluginBin = PACKAGE_NAME, ...opts } = options ?? {};
  return {
    executor: `${pluginBin}:cli`,
    outputs: [`{options.persist.outputDir}/report.*`],
    options: parseCliExecutorOptions(opts),
  };
}
