import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { objectToCliArgs } from '../../executors/internal/cli.js';
import { PACKAGE_NAME } from '../../internal/constants.js';

export function createConfigurationTarget(options?: {
  projectName?: string;
}): TargetConfiguration<RunCommandsOptions> {
  const { projectName } = options ?? {};
  const args = objectToCliArgs({
    ...(projectName ? { project: projectName } : {}),
  });
  return {
    command: `nx g ${PACKAGE_NAME}:configuration${args.length > 0 ? ` ${args.join(' ')}` : ''}`,
  };
}
