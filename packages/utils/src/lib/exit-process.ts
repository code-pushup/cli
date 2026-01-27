import os from 'node:os';
import process from 'node:process';

// POSIX shells convention: exit status = 128 + signal number
// https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html#:~:text=When%20a%20command%20terminates%20on%20a%20fatal%20signal%20whose%20number%20is%20N%2C%20Bash%20uses%20the%20value%20128%2BN%20as%20the%20exit%20status.
const UNIX_SIGNAL_EXIT_CODE_OFFSET = 128;
const unixSignalExitCode = (signalNumber: number) =>
  UNIX_SIGNAL_EXIT_CODE_OFFSET + signalNumber;

const SIGINT_CODE = 2;
const SIGTERM_CODE = 15;
const SIGQUIT_CODE = 3;

export const SIGNAL_EXIT_CODES = (): Record<SignalName, number> => {
  const isWindowsRuntime = os.platform() === 'win32';
  return {
    SIGINT: isWindowsRuntime ? SIGINT_CODE : unixSignalExitCode(SIGINT_CODE),
    SIGTERM: unixSignalExitCode(SIGTERM_CODE),
    SIGQUIT: unixSignalExitCode(SIGQUIT_CODE),
  };
};

export const DEFAULT_FATAL_EXIT_CODE = 1;

export type SignalName = 'SIGINT' | 'SIGTERM' | 'SIGQUIT';
export type FatalKind = 'uncaughtException' | 'unhandledRejection';

export type CloseReason =
  | { kind: 'signal'; signal: SignalName }
  | { kind: 'fatal'; fatal: FatalKind }
  | { kind: 'exit' };

export type ExitHandlerOptions = {
  onExit?: (code: number, reason: CloseReason) => void;
  onError?: (err: unknown, kind: FatalKind) => void;
  exitOnFatal?: boolean;
  exitOnSignal?: boolean;
  fatalExitCode?: number;
};

/**
 *
 * @param options - Options for the exit handler
 * @param options.onExit - Callback to be called when the process exits
 * @param options.onError - Callback to be called when an error occurs
 * @param options.exitOnFatal - Whether to exit the process on fatal errors
 * @param options.exitOnSignal - Whether to exit the process on signals
 * @param options.fatalExitCode - The exit code to use for fatal errors
 * @returns A function to unsubscribe from the exit handlers
 */
// eslint-disable-next-line max-lines-per-function
export function subscribeProcessExit(
  options: ExitHandlerOptions = {},
): () => void {
  // eslint-disable-next-line functional/no-let
  let closedReason: CloseReason | undefined;
  const {
    onExit,
    onError,
    exitOnFatal = false,
    exitOnSignal = false,
    fatalExitCode = DEFAULT_FATAL_EXIT_CODE,
  } = options;

  const close = (code: number, reason: CloseReason) => {
    if (closedReason) {
      return;
    }
    closedReason = reason;
    onExit?.(code, reason);
  };

  const uncaughtExceptionHandler = (err: unknown) => {
    onError?.(err, 'uncaughtException');
    if (exitOnFatal) {
      close(fatalExitCode, {
        kind: 'fatal',
        fatal: 'uncaughtException',
      });
    }
  };

  const unhandledRejectionHandler = (reason: unknown) => {
    onError?.(reason, 'unhandledRejection');
    if (exitOnFatal) {
      close(fatalExitCode, {
        kind: 'fatal',
        fatal: 'unhandledRejection',
      });
    }
  };

  const signalHandlers = (['SIGINT', 'SIGTERM', 'SIGQUIT'] as const).map(
    signal => {
      const handler = () => {
        close(SIGNAL_EXIT_CODES()[signal], { kind: 'signal', signal });
        if (exitOnSignal) {
          // eslint-disable-next-line unicorn/no-process-exit,n/no-process-exit
          process.exit(SIGNAL_EXIT_CODES()[signal]);
        }
      };
      process.on(signal, handler);
      return { signal, handler };
    },
  );

  const exitHandler = (code: number) => {
    if (closedReason) {
      return;
    }
    close(code, { kind: 'exit' });
  };

  process.on('uncaughtException', uncaughtExceptionHandler);
  process.on('unhandledRejection', unhandledRejectionHandler);
  process.on('exit', exitHandler);

  return () => {
    process.removeListener('uncaughtException', uncaughtExceptionHandler);
    process.removeListener('unhandledRejection', unhandledRejectionHandler);
    process.removeListener('exit', exitHandler);
    signalHandlers.forEach(({ signal, handler }) => {
      process.removeListener(signal, handler);
    });
  };
}
