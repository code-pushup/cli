import { logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { createCliCommand } from '../internal/cli';
import { normalizeContext } from '../internal/context';
import { AUTORUN_COMMAND } from './constants';
import { AutorunCommandExecutorOptions } from './schema';
import { parseAutorunExecutorOptions } from './utils';

export default runAutorunExecutor;

export function runAutorunExecutor(
  options: AutorunCommandExecutorOptions,
  context: ExecutorContext,
) {
  const normalizedContext = normalizeContext(context);
  const cliArgumentObject = parseAutorunExecutorOptions(
    options,
    normalizedContext,
  );
  const command = createCliCommand(AUTORUN_COMMAND, cliArgumentObject);

  const { dryRun } = options;
  if (dryRun) {
    logger.warn(`DryRun execution of: ${command}`);
  } else {
    try {
      // eslint-disable-next-line n/no-sync
      execSync(command, context.cwd ? { cwd: context.cwd } : {});
    } catch (error) {
      return {
        success: false,
        command,
        error,
      };
    }
  }

  return {
    success: true,
    command,
  };
}
