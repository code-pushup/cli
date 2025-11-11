import { type ExecutorContext } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import { objectToCliArgs } from '../internal/cli.js';
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
    ...env,
    ...(verbose && { CP_VERBOSE: 'true' }),
  };

  const { logger, stringifyError, formatCommand } = await import(
    '@code-pushup/utils'
  );
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
        ...(envVariables && {
          env: Object.fromEntries(
            Object.entries(envVariables).map(([v, k]) => [v, `"${k}"`]),
          ),
        }),
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
