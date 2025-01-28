import { type ExecutorContext, logger } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { createCliCommand } from '../internal/cli.js';
import { normalizeContext } from '../internal/context.js';
import type { AutorunCommandExecutorOptions } from './schema.js';
import { mergeExecutorOptions, parseAutorunExecutorOptions } from './utils.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default function runAutorunExecutor(
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

  const commandString = createCliCommand({ command, args: cliArgumentObject });
  const commandStringOptions = context.cwd ? { cwd: context.cwd } : {};
  if (verbose) {
    logger.info(`Run CLI executor ${command ?? ''}`);
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
        command: commandString,
        error: error as Error,
      });
    }
  }

  return Promise.resolve({
    success: true,
    command: commandString,
  });
}
