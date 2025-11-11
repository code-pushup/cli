import { type ExecutorContext } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import type { AutorunCommandExecutorOptions } from './schema.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runAutorunExecutor(
  terminalAndExecutorOptions: AutorunCommandExecutorOptions,
  { cwd }: ExecutorContext,
): Promise<ExecutorOutput> {
  const { logger, stringifyError, formatCommand } = await import(
    '@code-pushup/utils'
  );
  const { objectToCliArgs } = await import('@code-pushup/utils');

  const {
    dryRun,
    verbose,
    command: cliCommand,
    env,
    bin,
    ...argsObj
  } = terminalAndExecutorOptions;

  const command = bin ? `node` : 'npx';
  const positionals = [
    bin ?? '@code-pushup/cli',
    ...(cliCommand ? [cliCommand] : []),
  ];
  const args = objectToCliArgs(argsObj);
  const envVariables = {
    ...process.env,
    ...env,
    ...(verbose && { CP_VERBOSE: 'true' }),
  };

  const binString = `${command} ${positionals.join(' ')} ${args.join(' ')}`;
  const formattedBinString = formatCommand(binString, {
    env: envVariables,
    cwd,
  });

  if (dryRun) {
    logger.warn(`DryRun execution of: \n ${formattedBinString}`);
  } else {
    try {
      await executeProcess({
        command,
        args: [...positionals, ...args],
        env: envVariables,
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
