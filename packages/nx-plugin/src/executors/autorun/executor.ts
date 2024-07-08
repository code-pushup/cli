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
import {
  AutorunCommandExecutorOptions,
  autorunExecutorOptionsSchema,
} from './schema';

export default runAutorunExecutor;
export async function runAutorunExecutor(
  options: AutorunCommandExecutorOptions,
  context: ExecutorContext,
) {
  const normalizedContext = normalizeContext(context);

  const { dryRun } = options;

  const cliArgumentObject = await getConfigOptions(options, normalizedContext);
  const cfg = cliArgumentObject; //(await autorunExecutorOptionsSchema()).parse(cliArgumentObject);
  const command = createCliCommand(AUTORUN_COMMAND, cfg);

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

export async function getConfigOptions(
  options: AutorunCommandExecutorOptions,
  normalizedContext: NormalizedExecutorContext,
) {
  const { projectPrefix, ...cliOptions } = options;
  return {
    ...globalConfig(cliOptions),
    persist: await persistConfig(cliOptions.persist ?? {}, normalizedContext),
    upload: await uploadConfig(
      { projectPrefix, ...cliOptions.upload },
      normalizedContext,
    ),
  };
}
