import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { objectToCliArgs } from '../../executors/internal/cli.js';
import { PACKAGE_NAME } from '../../internal/constants.js';
import { CP_TARGET_NAME } from '../constants.js';

export function createConfigurationTarget(options?: {
  targetName?: string;
  projectName?: string;
  pluginBin?: string;
}): TargetConfiguration<RunCommandsOptions> {
  const {
    projectName,
    pluginBin = PACKAGE_NAME,
    targetName = CP_TARGET_NAME,
  } = options ?? {};
  return {
    command: `nx g ${pluginBin}:configuration ${objectToCliArgs({
      skipTarget: true,
      targetName,
      ...(projectName ? { project: projectName } : {}),
    }).join(' ')}`,
  };
}
