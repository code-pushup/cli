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
  onClose?: (code: number, reason: CloseReason) => void;
  onError?: (err: unknown, kind: FatalKind) => void;
  fatalExit?: boolean;
  signalExit?: boolean;
  fatalExitCode?: number;
};

export function installExitHandlers(options: ExitHandlerOptions = {}): void {
  // eslint-disable-next-line functional/no-let
  let closedReason: CloseReason | undefined;
  const {
    onClose,
    onError,
    fatalExit,
    signalExit,
    fatalExitCode = DEFAULT_FATAL_EXIT_CODE,
  } = options;

  const close = (code: number, reason: CloseReason) => {
    if (closedReason) {
      return;
    }
    closedReason = reason;
    onClose?.(code, reason);
  };

  process.on('uncaughtException', err => {
    onError?.(err, 'uncaughtException');
    if (fatalExit) {
      close(fatalExitCode, {
        kind: 'fatal',
        fatal: 'uncaughtException',
      });
    }
  });

  process.on('unhandledRejection', reason => {
    onError?.(reason, 'unhandledRejection');
    if (fatalExit) {
      close(fatalExitCode, {
        kind: 'fatal',
        fatal: 'unhandledRejection',
      });
    }
  });

  (['SIGINT', 'SIGTERM', 'SIGQUIT'] as const).forEach(signal => {
    process.on(signal, () => {
      close(SIGNAL_EXIT_CODES()[signal], { kind: 'signal', signal });
      if (signalExit) {
        // eslint-disable-next-line n/no-process-exit
        process.exit(SIGNAL_EXIT_CODES()[signal]);
      }
    });
  });

  process.on('exit', code => {
    if (closedReason) {
      return;
    }
    close(code, { kind: 'exit' });
  });
}
