import { type ExecutorContext, logger } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import {
  createCliCommandObject,
  createCliCommandString,
} from '../internal/cli.js';
import { normalizeContext } from '../internal/context.js';
import type { AutorunCommandExecutorOptions } from './schema.js';
import { mergeExecutorOptions, parseAutorunExecutorOptions } from './utils.js';

export function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'Error' || error.message.startsWith(error.name)) {
      return error.message;
    }
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
}

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
      ...(env ? { env } : {}),
      ...(dryRun != null ? { dryRun } : {}),
      ...(verbose ? { verbose } : {}),
    });
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      command: commandString,
      error: error instanceof Error ? error : new Error(stringifyError(error)),
    };
  }

  return {
    success: true,
    command: commandString,
  };
}
