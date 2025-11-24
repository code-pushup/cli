import { DEFAULT_PERSIST_FORMAT } from '@code-pushup/models';
import {
  type ProcessConfig,
  type ProcessObserver,
  executeProcess,
  logger,
  serializeCommandWithArgs,
} from '@code-pushup/utils';
import type { CommandContext } from './context.js';

export async function executeCliCommand(
  args: string[],
  context: CommandContext,
  options?: { hasFormats: boolean },
): Promise<void> {
  // eslint-disable-next-line functional/no-let
  let output = '';

  const logRaw = (message: string) => {
    if (!context.silent) {
      if (!output) {
        logger.newline();
      }
      logger.info(message, { noIndent: true, noLineBreak: true });
    }
    output += message;
  };

  const logEnd = () => {
    if (!context.silent && output) {
      logger.newline();
    }
  };

  const observer: ProcessObserver = {
    onStdout: logRaw,
    onStderr: logRaw,
    onComplete: logEnd,
    onError: logEnd,
  };

  const config: ProcessConfig = {
    command: context.bin,
    args: combineArgs(args, context, options),
    cwd: context.directory,
    observer,
    silent: true,
  };
  const bin = serializeCommandWithArgs(config);

  await logger.command(bin, async () => {
    try {
      await executeProcess(config);
    } catch (error) {
      // ensure output of failed process is always logged for debugging
      if (context.silent) {
        logger.newline();
        logger.info(output, { noIndent: true });
        if (!output.endsWith('\n')) {
          logger.newline();
        }
      }
      throw error;
    }
  });
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
