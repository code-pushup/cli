import path from 'node:path';
import process from 'node:process';
import type { ProfilerOptions } from './profiler.js';

const EXIT_HANDLERS_INSTALLED = Symbol.for(
  'codepushup.exit-handlers-installed',
);

const SIGNALS = [
  ['SIGINT', 130],
  ['SIGTERM', 143],
  ['SIGQUIT', 131],
] as const;

type FatalKind = 'uncaughtException' | 'unhandledRejection';

export interface FilenameParts {
  directory: string;
  filename: string;
}

export function getFilenameParts(options: ProfilerOptions): FilenameParts {
  const directory = options.outDir ?? path.join('tmp', 'profiles');
  const baseName = options.fileBaseName ?? 'timing.profile';
  const id =
    options.id ?? new Date().toISOString().slice(0, 19).replace(/:/g, '-');

  // Combine base name with ID if provided
  const filename = id ? `${baseName}.${id}` : baseName;

  return {
    directory,
    filename,
  };
}

export function installExitHandlersOnce(options: {
  onFatal: (kind: FatalKind, err: unknown) => void;
  onClose: () => void;
}): void {
  const g = globalThis as any;
  if (g[EXIT_HANDLERS_INSTALLED]) return;

  g[EXIT_HANDLERS_INSTALLED] = true;

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', err => {
    options.onFatal('uncaughtException', err);
  });

  process.on('unhandledRejection', reason => {
    options.onFatal('unhandledRejection', reason);
  });

  // Handle graceful shutdown signals
  for (const [signal] of SIGNALS) {
    process.on(signal, () => {
      options.onClose();
      process.exit(0);
    });
  }

  // Handle normal exit
  process.on('exit', () => {
    options.onClose();
  });
}
