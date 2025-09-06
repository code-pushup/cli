import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { objectToCliArgs } from '../../executors/internal/cli.js';
import { PACKAGE_NAME } from '../../internal/constants.js';

export function createConfigurationTarget(options?: {
  projectName?: string;
  bin?: string;
}): TargetConfiguration<RunCommandsOptions> {
  const { projectName, bin = PACKAGE_NAME } = options ?? {};
  const args = objectToCliArgs({
    ...(projectName ? { project: projectName } : {}),
  });
  return {
    command: `nx g ${bin}:configuration${args.length > 0 ? ` ${args.join(' ')}` : ''}`,
  };
}
