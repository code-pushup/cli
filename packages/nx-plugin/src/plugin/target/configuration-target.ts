import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { objectToCliArgs } from '../../executors/internal/cli.js';
import { PACKAGE_NAME } from '../../internal/constants.js';

export function createConfigurationTarget(options?: {
  targetName?: string;
  projectName?: string;
  pluginBin?: string;
}): TargetConfiguration<RunCommandsOptions> {
  const { projectName, pluginBin = PACKAGE_NAME } = options ?? {};
  const args = objectToCliArgs({
    ...(projectName ? { project: projectName } : {}),
  }).join(' ');
  return {
    command: `nx g ${pluginBin}:configuration${args ? ` ${args}` : ''}`,
  };
}
