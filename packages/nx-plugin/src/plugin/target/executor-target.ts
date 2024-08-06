import { TargetConfiguration } from '@nx/devkit';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { PACKAGE_NAME } from '../../internal/constants';

export function createExecutorTarget(options?: {
  projectName?: string;
  bin?: string;
}): TargetConfiguration<RunCommandsOptions> {
  const { bin = PACKAGE_NAME } = options ?? {};
  return {
    executor: `${bin}:autorun`,
  };
}
