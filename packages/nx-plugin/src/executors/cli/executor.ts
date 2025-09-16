import { type ExecutorContext, logger } from '@nx/devkit';
import { isVerbose } from '@code-pushup/utils';
import { executeProcess } from '../../internal/execute-process.js';
import {
  createCliCommandObject,
  createCliCommandString,
} from '../internal/cli.js';
import { normalizeContext } from '../internal/context.js';
import type { AutorunCommandExecutorOptions } from './schema.js';
import { mergeExecutorOptions, parseAutorunExecutorOptions } from './utils.js';

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
  const mergedOptions = mergeExecutorOptions(
    context.target?.options,
    terminalAndExecutorOptions,
  );
  const cliArgumentObject = parseAutorunExecutorOptions(
    mergedOptions,
    normalizedContext,
  );
  const { dryRun, verbose, command } = mergedOptions;
  const commandString = createCliCommandString({
    command,
    args: cliArgumentObject,
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
        ...createCliCommandObject({ command, args: cliArgumentObject }),
        ...(context.cwd ? { cwd: context.cwd } : {}),
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
