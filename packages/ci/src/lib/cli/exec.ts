import { DEFAULT_PERSIST_FORMAT } from '@code-pushup/models';
import {
  type ProcessConfig,
  type ProcessObserver,
  executeProcess,
  logger,
  serializeCommandWithArgs,
} from '@code-pushup/utils';
import type { CommandContext } from './context.js';

/**
 * Executes Code PushUp CLI command and logs output in a way that's more readable in CI.
 * @param args Arguments for Code PushUp CLI
 * @param context Command context
 * @param options Optional information on whether all persist formats are set (if known)
 */
export async function executeCliCommand(
  args: string[],
  context: CommandContext,
  options?: { hasFormats: boolean },
): Promise<void> {
  const { logOutputChunk, logOutputEnd, logSilencedOutput } =
    createLogCallbacks(context);

  const observer: ProcessObserver = {
    onStdout: logOutputChunk,
    onStderr: logOutputChunk,
    onComplete: logOutputEnd,
    onError: logOutputEnd,
  };

  const config: ProcessConfig = {
    command: context.bin,
    args: combineArgs(args, context, options),
    cwd: context.directory,
    observer,
    silent: true,
  };
  const bin = serializeCommandWithArgs(config);

  try {
    await logger.command(bin, async () => {
      try {
        await executeProcess(config);
      } catch (error) {
        // ensure output of failed process is always logged for debugging
        logSilencedOutput();
        throw error;
      }
    });
  } finally {
    logger.newline();
  }
}

function createLogCallbacks(context: Pick<CommandContext, 'silent'>) {
  // eslint-disable-next-line functional/no-let
  let output = '';

  const logOutputChunk = (message: string) => {
    if (!context.silent) {
      if (!output) {
        logger.newline();
      }
      logger.info(message, { noIndent: true, noLineBreak: true });
    }
    output += message;
  };

  const logOutputEnd = () => {
    if (!context.silent && output) {
      logger.newline();
    }
  };

  const logSilencedOutput = () => {
    if (context.silent) {
      logger.newline();
      logger.info(output, { noIndent: true });
      if (!output.endsWith('\n')) {
        logger.newline();
      }
    }
  };

  return { logOutputChunk, logOutputEnd, logSilencedOutput };
}

function combineArgs(
  args: string[],
  context: CommandContext,
  options: { hasFormats?: boolean } | undefined,
): string[] {
  return [
    ...(context.config ? [`--config=${context.config}`] : []),
    ...args,
    ...(options?.hasFormats === false
      ? DEFAULT_PERSIST_FORMAT.map(format => `--persist.format=${format}`)
      : []),
  ];
}
