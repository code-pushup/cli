import type { ExecutorContext } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import type { AutorunCommandExecutorOptions } from './schema.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

/* eslint-disable max-lines-per-function */
export default async function runAutorunExecutor(
  terminalAndExecutorOptions: AutorunCommandExecutorOptions,
  { cwd }: ExecutorContext,
): Promise<ExecutorOutput> {
  const { logger, stringifyError, objectToCliArgs, formatCommand } =
    await import('@code-pushup/utils');
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
    cwd,
  });

  if (dryRun) {
    logger.warn(`DryRun execution of: \n ${formattedBinString}`);
  } else {
    try {
      await executeProcess({
        command,
        args: [...positionals, ...args],
        ...(cwd ? { cwd } : {}),
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
