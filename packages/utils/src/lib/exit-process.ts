import process from 'node:process';

/* eslint-disable  @typescript-eslint/no-magic-numbers */
const SIGNALS = [
  ['SIGINT', 130],
  ['SIGTERM', 143],
  ['SIGQUIT', 131],
] as const;
/* eslint-enable  @typescript-eslint/no-magic-numbers */

export type FatalKind = 'uncaughtException' | 'unhandledRejection';
type ExitHandlerOptions =
  | {
      onClose?: () => void;
      onFatal: (err: unknown, kind?: FatalKind) => void;
    }
  | {
      onClose: () => void;
      onFatal?: never;
    };

export function installExitHandlers(options: ExitHandlerOptions): void {
  // Fatal errors
  process.on('uncaughtException', err => {
    options.onFatal?.(err, 'uncaughtException');
  });

  process.on('unhandledRejection', reason => {
    options.onFatal?.(reason, 'unhandledRejection');
  });

  // Graceful shutdown signals
  SIGNALS.forEach(([signal]) => {
    process.on(signal, () => {
      options.onClose?.();
    });
  });

  // Normal exit
  process.on('exit', () => {
    options.onClose?.();
  });
}
