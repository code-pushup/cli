import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { objectToCliArgs } from '../../executors/internal/cli';
import { PACKAGE_NAME } from '../../internal/constants';
import { CP_TARGET_NAME } from '../constants';

export function createConfigurationTarget(options?: {
  targetName?: string;
  projectName?: string;
  bin?: string;
}): TargetConfiguration<RunCommandsOptions> {
  const {
    projectName,
    bin = PACKAGE_NAME,
    targetName = CP_TARGET_NAME,
  } = options ?? {};
  return {
    command: `nx g ${bin}:configuration ${objectToCliArgs({
      skipTarget: true,
      targetName,
      ...(projectName ? { project: projectName } : {}),
    }).join(' ')}`,
  };
}
