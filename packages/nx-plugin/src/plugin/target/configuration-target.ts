import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { PACKAGE_NAME } from '../../internal/constants.js';

export async function createConfigurationTarget(options?: {
  projectName?: string;
}): Promise<TargetConfiguration<RunCommandsOptions>> {
  const { projectName } = options ?? {};
  const { objectToCliArgs } = await import('@code-pushup/utils');
  const args = objectToCliArgs({
    ...(projectName ? { project: projectName } : {}),
  });
  const argsString = args.length > 0 ? ` ${args.join(' ')}` : '';
  return {
    command: `nx g ${PACKAGE_NAME}:configuration${argsString}`,
  };
}
