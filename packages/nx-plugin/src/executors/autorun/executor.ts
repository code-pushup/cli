import { logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { createCliCommand } from '../internal/cli';
import { globalConfig, persistConfig, uploadConfig } from '../internal/config';
import {
  NormalizedExecutorContext,
  normalizeContext,
} from '../internal/context';
import { AUTORUN_COMMAND } from './constants';
import { AutorunCommandExecutorOptions } from './schema';
import { autorunExecutorOnlyConfig } from './utils';

export default runAutorunExecutor;
export async function runAutorunExecutor(
  options: AutorunCommandExecutorOptions,
  context: ExecutorContext,
) {
  const normalizedContext = normalizeContext(context);

  const { dryRun } = options;

  const cliArgumentObject = await getExecutorOptions(
    options,
    normalizedContext,
  );
  logger.info(JSON.stringify(cliArgumentObject));
  const command = createCliCommand(AUTORUN_COMMAND, cliArgumentObject);

  if (dryRun) {
    logger.warn(`DryRun execution of: ${command}`);
  } else {
    // eslint-disable-next-line n/no-sync
    execSync(command, context.cwd ? { cwd: context.cwd } : {});
  }

  return {
    success: true,
    command,
  };
}

export async function getExecutorOptions(
  options: AutorunCommandExecutorOptions,
  normalizedContext: NormalizedExecutorContext,
): Promise<Required<AutorunCommandExecutorOptions>> {
  const { projectPrefix, ...cliOptions } = options;
  return {
    ...globalConfig(cliOptions),
    ...autorunExecutorOnlyConfig(options),
    persist: await persistConfig(
      { projectPrefix, ...cliOptions.persist },
      normalizedContext,
    ),
    upload: await uploadConfig(
      { projectPrefix, ...cliOptions.upload },
      normalizedContext,
    ),
  };
}
