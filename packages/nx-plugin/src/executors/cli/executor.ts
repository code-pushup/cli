import type { ExecutorContext } from '@nx/devkit';
import { executeProcess } from '../../internal/execute-process.js';
import { normalizeContext } from '../internal/context.js';
import type { CliCommandExecutorOptions } from './schema.js';
import { parseCliExecutorOptions } from './utils.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

/* eslint-disable-next-line max-lines-per-function */
export default async function runCliExecutor(
  terminalAndExecutorOptions: CliCommandExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorOutput> {
  const { objectToCliArgs, formatCommandStatus, logger, stringifyError } =
    await import('@code-pushup/utils');
  const normalizedContext = normalizeContext(context);
  const {
    command: cliCommand,
    verbose = false,
    dryRun,
    env: executorEnv,
    bin,
    projectPrefix, // @TODO do not forward to CLI. Handle in plugin logic only
    ...restArgs
  } = parseCliExecutorOptions(terminalAndExecutorOptions, normalizedContext);
  // this sets `CP_VERBOSE=true` on process.env
  logger.setVerbose(verbose);

  const command = bin ? `node` : 'npx';
  const args = [
    bin ?? '@code-pushup/cli',
    ...(cliCommand ? [cliCommand] : []),
    ...objectToCliArgs(restArgs),
  ];
  const loggedEnvVars = {
    ...executorEnv,
    ...(verbose && { CP_VERBOSE: 'true' }),
  };
  const commandString = formatCommandStatus([command, ...args].join(' '), {
    cwd: context.cwd,
    env: loggedEnvVars,
  });

  if (dryRun) {
    logger.warn(`DryRun execution of: ${commandString}`);
  } else {
    try {
      logger.debug(`Run CLI with env vars: ${JSON.stringify(loggedEnvVars)}`);
      await executeProcess({
        command,
        args,
        ...(context.cwd ? { cwd: context.cwd } : {}),
        ...(executorEnv && Object.keys(executorEnv).length > 0
          ? {
              env: {
                // if env is undefined, executeProcess extends process.env by default
                ...process.env,
                // we don't pass `CP_VERBOSE=true` as it is handled inside logger.setVerbose
                ...executorEnv,
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
