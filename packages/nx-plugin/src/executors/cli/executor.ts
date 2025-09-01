import { type ExecutorContext, logger } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { createCliCommand } from '../internal/cli.js';
import { normalizeContext } from '../internal/context.js';
import type { AutorunCommandExecutorOptions } from './schema.js';
import {
  mergeExecutorOptions,
  objectToCliArgs,
  parseAutorunExecutorOptions,
} from './utils.js';

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
      const { executeProcess }: typeof import('@code-pushup/utils') =
        await import('@code-pushup/utils');
      await executeProcess({
        command: command,
        args: objectToCliArgs(cliArgumentObject),
        observer: {
          error: data => {
            process.stderr.write(data);
          },
          next: data => {
            process.stdout.write(data);
          },
        },
      });
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
