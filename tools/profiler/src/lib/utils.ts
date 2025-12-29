import path from 'node:path';
import process from 'node:process';

type FatalKind = 'uncaughtException' | 'unhandledRejection';

export class ExitHandlerError extends Error {
  constructor(public readonly kind: FatalKind) {
    super(`Exit handler error: ${kind}`);
    this.name = 'ExitHandlerError';
  }
}

const EXIT_HANDLERS_INSTALLED = Symbol.for(
  'codepushup.exit-handlers-installed',
);

export const SIGNALS = [
  ['SIGINT', 130],
  ['SIGTERM', 143],
  ['SIGQUIT', 131],
] as const;

export function installExitHandlersOnce(opts: {
  onClose: () => void;
  onFatal?: (kind: FatalKind, error: unknown) => void;
}): void {
  const g = globalThis as any;
  if (g[EXIT_HANDLERS_INSTALLED]) return;
  g[EXIT_HANDLERS_INSTALLED] = true;

  const safe = (fn?: () => void) => {
    try {
      fn?.();
    } catch {}
  };
  const close = () => safe(opts.onClose);

  (['beforeExit', 'exit'] as const).forEach(ev => process.on(ev, close));

  SIGNALS.forEach(([sig, code]) =>
    process.on(sig, () => {
      close();
      process.exit(code);
    }),
  );

  process.on('uncaughtException', err => {
    safe(() => opts.onFatal?.('uncaughtException', err));
    close();
    throw err;
  });

  process.on('unhandledRejection', reason => {
    safe(() => opts.onFatal?.('unhandledRejection', reason));
    close();
  });
}

export function getFilenameParts<K extends string = never>(
  options: { outDir?: string; fileBaseName?: string; id?: string } = {},
): { filename: string; directory: string } {
  const directory =
    options.outDir ?? path.join(process.cwd(), 'tmp', 'profiles');
  const base = options.fileBaseName ?? 'timing.profile';
  const stamp =
    options.id ?? new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${base}.${stamp}`;
  return { filename, directory };
}
