import type { ExecutorContext } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import { normalizeContext } from '../internal/context.js';
import type { AutorunCommandExecutorOptions } from './schema.js';
import { parseAutorunExecutorOptions } from './utils.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

/* eslint-disable-next-line max-lines-per-function */
export default async function runAutorunExecutor(
  terminalAndExecutorOptions: AutorunCommandExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorOutput> {
  const { objectToCliArgs, formatCommandStatus, logger, stringifyError } =
    await import('@code-pushup/utils');
  const normalizedContext = normalizeContext(context);
  const cliArgumentObject = parseAutorunExecutorOptions(
    terminalAndExecutorOptions,
    normalizedContext,
  );
  const { command: cliCommand } = terminalAndExecutorOptions;
  const { dryRun, verbose, bin, ...restArgs } = cliArgumentObject;
  const command = bin ? `node` : 'npx';
  const positionals = [
    bin ?? '@code-pushup/cli',
    ...(cliCommand ? [cliCommand] : []),
  ];
  const args = [...positionals, ...objectToCliArgs(restArgs)];
  const executorEnvVariables = {
    ...(verbose && { CP_VERBOSE: 'true' }),
  };
  const commandString = formatCommandStatus([command, ...args].join(' '), {
    cwd: context.cwd,
    env: executorEnvVariables,
  });

  if (dryRun) {
    logger.warn(`DryRun execution of: ${commandString}`);
  } else {
    try {
      logger.debug(`With env vars: ${executorEnvVariables}`);
      await executeProcess({
        command,
        args,
        ...(context.cwd ? { cwd: context.cwd } : {}),
        ...(verbose
          ? {
              env: {
                ...process.env,
                ...executorEnvVariables,
              },
            }
          : {}),
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
