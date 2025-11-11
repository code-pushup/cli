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

  // Extract --import flags from NODE_OPTIONS if present (Node.js doesn't allow --import in NODE_OPTIONS)
  let importArgs: string[] = [];
  const envVariables = { ...env };

  if (bin && env?.NODE_OPTIONS) {
    const nodeOptions = env.NODE_OPTIONS;
    // Match --import <value> or --import=<value>
    const importMatch = nodeOptions.match(/--import(?:\s+|=)(\S+)/);
    if (importMatch && importMatch[1]) {
      importArgs = ['--import', importMatch[1]];
      // Remove --import flag from NODE_OPTIONS
      const cleaned = nodeOptions.replace(/--import(?:\s+|=)\S+/g, '').trim();
      if (cleaned) {
        envVariables.NODE_OPTIONS = cleaned;
      } else {
        delete envVariables.NODE_OPTIONS;
      }
    }
  }

  const positionals = [
    ...importArgs, // Add --import flags before the script when using node
    bin ?? '@code-pushup/cli',
    ...(cliCommand ? [cliCommand] : []),
  ];
  const args = objectToCliArgs(argsObj);

  if (verbose) {
    envVariables.CP_VERBOSE = 'true';
  }

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
        ...(envVariables && { env: envVariables }),
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
