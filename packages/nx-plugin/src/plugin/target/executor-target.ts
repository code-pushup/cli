import type { TargetConfiguration } from '@nx/devkit';
import type { AutorunCommandExecutorOptions } from '../../executors/cli/schema.js';
import { parseAutorunExecutorOptions } from '../../executors/cli/utils.js';
import { PACKAGE_NAME } from '../../internal/constants.js';
import type { ProjectPrefixOptions } from '../types.js';

export function createExecutorTarget(
  options: {
    bin?: string;
  } & AutorunCommandExecutorOptions,
): TargetConfiguration<ProjectPrefixOptions & AutorunCommandExecutorOptions> {
  const { bin = PACKAGE_NAME, ...opts } = options ?? {};
  return {
    executor: `${bin}:cli`,
    outputs: [
      `{options.persist.outputDir}/report.md`,
      `{options.persist.outputDir}/report.json`,
    ],
    options: parseAutorunExecutorOptions(opts),
  };
}
