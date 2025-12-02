import type { ExecutorContext } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import { normalizeContext } from '../internal/context.js';
import type { AutorunCommandExecutorOptions } from './schema.js';
import { mergeExecutorOptions, parseAutorunExecutorOptions } from './utils.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

/* eslint-disable max-lines-per-function */
export default async function runAutorunExecutor(
  terminalAndExecutorOptions: AutorunCommandExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorOutput> {
  const { logger, stringifyError, objectToCliArgs, formatCommand } =
    await import('@code-pushup/utils');
  const normalizedContext = normalizeContext(context);
  const mergedOptions = mergeExecutorOptions(
    context.target?.options,
    terminalAndExecutorOptions,
  );
  const cliArgumentObject = parseAutorunExecutorOptions(
    mergedOptions,
    normalizedContext,
  );
  const {
    dryRun,
    verbose,
    command: cliCommand,
    bin,
    ...argsObj
  } = terminalAndExecutorOptions;
  const command = bin ? `node` : 'npx';
  const positionals = [
    bin ?? '@code-pushup/cli',
    ...(cliCommand ? [cliCommand] : []),
  ];
  const args = objectToCliArgs(argsObj);
  const executorEnvVariables = {
    ...(verbose && { CP_VERBOSE: 'true' }),
  };
  const binString = `${command} ${positionals.join(' ')} ${args.join(' ')}`;
  const formattedBinString = formatCommand(binString, {
    env: executorEnvVariables,
    cwd: context.cwd,
  });

  if (dryRun) {
    logger.warn(`DryRun execution of: \n ${formattedBinString}`);
  } else {
    try {
      await executeProcess({
        command,
        args: [...positionals, ...args],
        ...(context.cwd ? { cwd: context.cwd } : {}),
      });
    } catch (error) {
      logger.error(stringifyError(error));
      return {
        success: false,
        command: formattedBinString,
        error: error instanceof Error ? error : new Error(`${error}`),
      };
    }
  }
  return {
    success: true,
    command: formattedBinString,
  };
}
/* eslint-enable max-lines-per-function */
