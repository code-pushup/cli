import { TargetConfiguration } from '@nx/devkit';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { PACKAGE_NAME } from '../../internal/constants';

export type ConfigurationTargetOptions = {
  projectName?: string;
  bin?: string;
};
export function createConfigurationTarget(
  options?: ConfigurationTargetOptions,
): TargetConfiguration<RunCommandsOptions> {
  const { projectName, bin } = options ?? {};
  const projectFlag = projectName && ` --project=${projectName}`;
  return {
    command: `nx g ${bin ?? PACKAGE_NAME}:configuration${projectFlag ?? ''}`,
  };
}
