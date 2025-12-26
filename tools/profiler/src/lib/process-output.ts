import { closeSync, fsyncSync, mkdirSync, openSync, writeSync } from 'node:fs';
import path from 'node:path';

/**
 * ProcessOutput interface for buffered file output.
 */
export interface ProcessOutput {
  readonly filePath: string;
  writeLine(obj: unknown): void;
  writeLineImmediate(obj: unknown): void;
  flush(): void;
  close(): void;
}

/**
 * Create a ProcessOutput instance with configurable buffer size.
 * This can be used to write logs or profiles to a file e.g. JSONL format.
 */
export function createProcessOutput(opts: {
  filePath: string;
  flushEveryN?: number;
}): ProcessOutput {
  const flushEveryN = opts.flushEveryN ?? 200;

  let fd: number | undefined;
  let closed = false;
  let buffer: string[] = [];
  const bufferSize = flushEveryN;

  const initializeFile = (): void => {
    try {
      mkdirSync(path.dirname(opts.filePath), { recursive: true });
      fd = openSync(opts.filePath, 'a');
    } catch (error) {
      throw new ProcessOutputError(
        `Failed to initialize file "${opts.filePath}"`,
        error as Error,
      );
    }
  };

  initializeFile();

  return {
    filePath: opts.filePath,

    writeLine(obj: unknown): void {
      if (closed) return;

      buffer.push(`${JSON.stringify(obj)}\n`);

      if (buffer.length >= bufferSize) {
        this.flush();
      }
    },

    writeLineImmediate(obj: unknown): void {
      if (closed) return;

      const line = `${JSON.stringify(obj)}\n`;

      if (fd != null) {
        try {
          writeSync(fd, line, undefined, 'utf8');
        } catch (error) {
          throw new ProcessOutputError(
            `Failed to write to file descriptor for "${opts.filePath}"`,
            error as Error,
          );
        }
      }
    },

    flush(): void {
      if (buffer.length === 0) return;

      const data = buffer.join('');
      buffer = [];

      if (fd != null) {
        try {
          writeSync(fd, data, undefined, 'utf8');
          fsyncSync(fd);
        } catch (error) {
          throw new ProcessOutputError(
            `Failed to flush buffer to file descriptor for "${opts.filePath}"`,
            error as Error,
          );
        }
      }
    },

    close(): void {
      if (closed) return;
      closed = true;

      this.flush();

      if (fd != null) {
        try {
          closeSync(fd);
        } catch (error) {
          throw new ProcessOutputError(
            `Failed to close file descriptor for "${opts.filePath}"`,
            error as Error,
          );
        }
        fd = undefined;
      }
    },
  };
}

export class ProcessOutputError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = 'ProcessOutputError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProcessOutputError);
    }
  }
}
