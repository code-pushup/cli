import { type ExecutorContext, logger } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import {
  createCliCommandObject,
  createCliCommandString,
} from '../internal/cli.js';
import { normalizeContext } from '../internal/context.js';
import type { AutorunCommandExecutorOptions } from './schema.js';
import { parseAutorunExecutorOptions } from './utils.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runAutorunExecutor(
  terminalAndExecutorOptions: AutorunCommandExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorOutput> {
  const normalizedContext = normalizeContext(context);
  const cliArgumentObject = parseAutorunExecutorOptions(
    terminalAndExecutorOptions,
    normalizedContext,
  );
  const { dryRun, verbose, command, bin } = terminalAndExecutorOptions;
  const commandString = createCliCommandString({
    command,
    args: cliArgumentObject,
    bin,
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
        ...createCliCommandObject({ command, args: cliArgumentObject, bin }),
        ...(context.cwd ? { cwd: context.cwd } : {}),
      });
    } catch (error) {
      logger.error(error);
      return {
        success: false,
        command: commandString,
        error: error instanceof Error ? error : new Error(`${error}`),
      };
    }
  }
  return {
    success: true,
    command: commandString,
  };
}
