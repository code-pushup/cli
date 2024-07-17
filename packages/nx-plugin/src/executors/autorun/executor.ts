import { ExecutorContext, logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { createCliCommand } from '../internal/cli';
import { normalizeContext } from '../internal/context';
import { AUTORUN_COMMAND } from './constants';
import { AutorunCommandExecutorOptions } from './schema';
import { parseAutorunExecutorOptions } from './utils';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default function runAutorunExecutor(
  terminalAndExecutorOptions: AutorunCommandExecutorOptions,
  context: ExecutorContext,
) {
  const normalizedContext = normalizeContext(context);
  const cliArgumentObject = parseAutorunExecutorOptions(
    terminalAndExecutorOptions,
    normalizedContext,
  );
  // console.log('AutorunCommandExecutorOptions: ', terminalAndExecutorOptions);
  // console.log('cliArgumentObject: ', cliArgumentObject);

  const command = createCliCommand(AUTORUN_COMMAND, cliArgumentObject);

  const { dryRun } = terminalAndExecutorOptions;
  if (dryRun) {
    logger.warn(`DryRun execution of: ${command}`);
  } else {
    try {
      logger.warn(`Execution of: ${command}`);

      // eslint-disable-next-line n/no-sync
      execSync(command, context.cwd ? { cwd: context.cwd } : {});
    } catch (error) {
      return Promise.resolve({
        success: false,
        command,
        error,
      });
    }
  }

  return Promise.resolve({
    success: true,
    command,
  } satisfies ExecutorOutput);
}
