import { TargetConfiguration } from '@nx/devkit';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
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
  const projectFlag = projectName && ` --project=${projectName}`;
  return {
    command: `nx g ${bin}:configuration --skipTarget --targetName=${targetName}${
      projectFlag ?? ''
    }`,
  };
}
