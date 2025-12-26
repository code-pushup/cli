// ExitHandlerError
export class ExitHandlerError extends Error {
  constructor(type: string) {
    super(`${type}`);
    this.name = 'ExitHandlerError';
  }
}

export function installExitHandlers({
  envVar = 'EXIT_HANDLERS',
  safeClose,
}: {
  envVar?: string;
  safeClose: (error?: unknown) => void;
}): void {
  if (process.env[envVar] != null) {
    return;
  }
  process.env[envVar] = 'true';

  process.on('beforeExit', () => safeClose());
  process.on('exit', () => safeClose());
  process.on('SIGINT', () => {
    safeClose();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    safeClose();
    process.exit(143);
  });

  process.on('uncaughtException', err => {
    safeClose(new ExitHandlerError('uncaughtException'));
    throw err;
  });

  process.on('unhandledRejection', reason => {
    safeClose(new ExitHandlerError('unhandledRejection'));
  });
}
