import { type ExecutorContext, logger } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
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
  const { objectToCliArgs, formatCommand } = await import('@code-pushup/utils');
  const normalizedContext = normalizeContext(context);
  const cliArgumentObject = parseAutorunExecutorOptions(
    terminalAndExecutorOptions,
    normalizedContext,
  );
  const {
    dryRun,
    verbose,
    command: cliCommand,
    bin,
  } = terminalAndExecutorOptions;
  const command = bin ? `node` : 'npx';
  const positionals = [
    bin ?? '@code-pushup/cli',
    ...(cliCommand ? [cliCommand] : []),
  ];
  const args = [...positionals, ...objectToCliArgs(cliArgumentObject)];
  const commandString = formatCommand([command, ...args].join(' '), {
    cwd: context.cwd,
  });
  if (verbose) {
    logger.info(`Run CLI executor ${command ?? ''}`);
    logger.info(`Command: ${commandString}`);
  }
  if (dryRun) {
    logger.warn(`DryRun execution of: ${commandString}`);
  } else {
    try {
      await executeProcess({
        command,
        args,
        ...(context.cwd ? { cwd: context.cwd } : {}),
      });
    } catch (error) {
      logger.error(error);
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
