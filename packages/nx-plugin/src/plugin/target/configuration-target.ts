import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { objectToCliArgs } from '../../internal/command.js';
import { PACKAGE_NAME } from '../../internal/constants.js';
import { CP_TARGET_NAME } from '../constants.js';

export function createConfigurationTarget(options?: {
  targetName?: string;
  projectName?: string;
}): TargetConfiguration<RunCommandsOptions> {
  const { projectName, targetName = CP_TARGET_NAME } = options ?? {};
  return {
    command: `nx g ${PACKAGE_NAME}:configuration ${objectToCliArgs({
      skipTarget: true,
      targetName,
      ...(projectName ? { project: projectName } : {}),
    }).join(' ')}`,
  };
}
