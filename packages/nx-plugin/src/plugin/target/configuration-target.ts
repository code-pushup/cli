import { TargetConfiguration } from '@nx/devkit';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { PACKAGE_NAME } from '../../internal/constants';

export function createConfigurationTarget(
  projectName?: string,
): TargetConfiguration<RunCommandsOptions> {
  const projectFlag = projectName && ` --project=${projectName}`;
  return {
    command: `nx g ${PACKAGE_NAME}:configuration${projectFlag ?? ''}`,
  };
}
