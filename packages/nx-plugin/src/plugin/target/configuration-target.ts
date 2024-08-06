import { TargetConfiguration } from '@nx/devkit';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { PACKAGE_NAME } from '../../internal/constants';

export function createConfigurationTarget(options?: {
  projectName?: string;
  bin?: string;
}): TargetConfiguration<RunCommandsOptions> {
  const { projectName, bin = PACKAGE_NAME } = options ?? {};
  const projectFlag = projectName && ` --project=${projectName}`;
  return {
    command: `nx g ${bin}:configuration${projectFlag ?? ''}`,
  };
}
