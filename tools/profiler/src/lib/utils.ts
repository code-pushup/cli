import path from 'node:path';
import process from 'node:process';
import { type ProfilerOptions } from './profiler.js';

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

export const PROFILER_OUT_DIR = path.join('tmp', 'profiles');
export const PROFILER_FILE_BASE_NAME = 'timing.profile';

export function getFilenameParts(options: ProfilerOptions): FilenameParts {
  const directory = options.outDir ?? PROFILER_OUT_DIR;

  // If fileName is provided, use it directly without timestamp
  if (options.fileName) {
    return {
      directory,
      filename: options.fileName,
    };
  }

  // Otherwise use fileBaseName with timestamp
  const baseName = options.fileBaseName ?? PROFILER_FILE_BASE_NAME;
  const id = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${baseName}.${id}`;

  return {
    directory,
    filename,
  };
}

export function installExitHandlersOnce(options: {
  onFatal: (err: unknown, kind?: FatalKind) => void;
  onClose: () => void;
}): void {
  const g = globalThis as any;
  if (g[EXIT_HANDLERS_INSTALLED]) return;

  g[EXIT_HANDLERS_INSTALLED] = true;

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', err => {
    options.onFatal(err, 'uncaughtException');
  });

  process.on('unhandledRejection', reason => {
    options.onFatal(reason, 'unhandledRejection');
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
