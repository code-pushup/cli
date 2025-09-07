import { type ExecutorContext, logger } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import {
  createCliCommandObject,
  createCliCommandString,
} from '../internal/cli.js';
import type { CliExecutorOptions } from './schema.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runCliExecutor(
  terminalAndExecutorOptions: CliExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorOutput> {
  const { cwd } = context;
  const { dryRun, verbose, command, ...opts } = terminalAndExecutorOptions;
  const commandArgs = {
    ...opts,
    dryRun,
    verbose,
  };
  const commandString = createCliCommandString({
    command,
    args: commandArgs,
  });
  if (verbose) {
    logger.info(`Run CLI executor ${command ?? ''}`);
    logger.info(`Command: ${commandString}`);
  }
  if (dryRun) {
    logger.warn(`DryRun execution of: ${commandString}`);
  } else {
    try {
      await executeProcess({
        ...createCliCommandObject({ command, args: commandArgs }),
        ...(cwd ? { cwd } : {}),
      });
    } catch (error) {
      logger.error(error);
      return {
        success: false,
        command: commandString,
        error: error as Error,
      };
    }
  }
  return {
    success: true,
    command: commandString,
  };
}
