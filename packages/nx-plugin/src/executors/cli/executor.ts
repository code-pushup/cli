import { type ExecutorContext } from '@nx/devkit';
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
  const { logger, stringifyError } = await import('@code-pushup/utils');
  const normalizedContext = normalizeContext(context);
  const cliArgumentObject = parseAutorunExecutorOptions(
    terminalAndExecutorOptions,
    normalizedContext,
  );
  const { dryRun, verbose, command, bin, ...args } = cliArgumentObject;
  const executorEnvVariables = {
    ...process.env,
    ...(verbose && { CP_VERBOSE: 'true' }),
  };
  const commandString = createCliCommandString({
    command,
    args,
    bin,
  });

  if (dryRun) {
    logger.warn(`DryRun execution of: ${commandString}`);
  } else {
    try {
      await executeProcess({
        ...createCliCommandObject({ command, args, bin }),
        ...(context.cwd ? { cwd: context.cwd } : {}),
        ...(verbose ? { env: executorEnvVariables } : {}),
      });
    } catch (error) {
      logger.error(stringifyError(error));
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
