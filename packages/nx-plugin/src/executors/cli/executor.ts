import { type ExecutorContext, logger } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import {
  createCliCommandObject,
  createCliCommandString,
  formatCommandLog,
  objectToCliArgs,
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
  const { env, bin, ...mergedOptions } = mergeExecutorOptions(
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
    bin,
    args: cliArgumentObject,
  });

  if (verbose) {
    logger.info(`Run CLI executor ${command ?? ''}`);
  }

  try {
    await executeProcess({
      ...createCliCommandObject({ command, args: cliArgumentObject, bin }),
      ...(context.cwd ? { cwd: context.cwd } : {}),
      env,
      dryRun,
    });
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      command: commandString,
      error: error as Error,
    };
  }

  return {
    success: true,
    command: commandString,
  };
}
