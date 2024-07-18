import { TargetConfiguration } from '@nx/devkit';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';

export function createInitTarget(
  projectName?: string,
): TargetConfiguration<RunCommandsOptions> {
  const projectFlag = projectName && ` --project=${projectName}`;
  return {
    command: `nx g nx-plugin:init${projectFlag ?? ''}`,
  };
}
