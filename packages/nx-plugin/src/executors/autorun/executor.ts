import { logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { createCliCommand } from '../internal/cli';
import { normalizeContext } from '../internal/context';
import { AUTORUN_COMMAND } from './constants';
import { AutorunCommandExecutorOptions } from './schema';
import { getExecutorOptions } from './utils';

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
