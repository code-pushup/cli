import { ExecutorContext, logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { createCliCommand } from '../internal/cli';
import { normalizeContext } from '../internal/context';
import { AUTORUN_COMMAND } from './constants';
import { AutorunCommandExecutorOptions } from './schema';
import { parseAutorunExecutorOptions } from './utils';
import {bold} from "ansis";

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
  const { dryRun, verbose, command = AUTORUN_COMMAND } = terminalAndExecutorOptions;

  const commandString = createCliCommand(command, cliArgumentObject);
  const commandStringOptions = context.cwd ? { cwd: context.cwd } : {};
  if (verbose) {
    logger.info(`Run CLI executor with commandString: ${bold(command)}`);
    logger.info(`Command: ${commandString}`);
  }
  if (dryRun) {
    logger.warn(`DryRun execution of: ${commandString}`);
  } else {
    try {
      // @TODO use executeProcess instead of execSync -> non blocking, logs #761
      // eslint-disable-next-line n/no-sync
      execSync(commandString, commandStringOptions);
    } catch (error) {
      logger.error(error);
      return Promise.resolve({
        success: false,
        commandString,
        error,
      });
    }
  }

  return Promise.resolve({
    success: true,
    command: commandString,
  } satisfies ExecutorOutput);
}
