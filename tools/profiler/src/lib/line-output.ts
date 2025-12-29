import {
  closeSync,
  fstatSync,
  fsyncSync,
  ftruncateSync,
  mkdirSync,
  openSync,
  readSync,
  writeSync,
} from 'node:fs';
import path from 'node:path';

export class LineOutputError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = 'LineOutputError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LineOutputError);
    }
  }
}

export interface LineOutput<Encoded = unknown, Decoded = string> {
  readonly filePath: string;
  writeLine(obj: Encoded): void;
  writeLineImmediate(obj: Encoded): void;
  flush(opts?: { durable?: boolean }): void;
  close(): void;
  recover(): {
    skippedLines: string[];
  };
}

export function createLineOutput<Encoded = unknown, Decoded = string>(opts: {
  filePath: string;
  flushEveryN?: number;
  flushAfterBytes?: number;
  encode?: (obj: Encoded) => string | string[] | undefined;
  parse?: (line: string) => Decoded;
  onRecoverSkip?: (line: string, error: unknown) => void;
}): LineOutput<Encoded, Decoded> {
  const flushAfterBytes = opts.flushAfterBytes;
  const defaultEncoder = (obj: unknown) =>
    typeof obj === 'string' ? obj : JSON.stringify(obj);
  const defaultParser = (line: string) => line as unknown as Decoded;
  const encoder = opts.encode ?? defaultEncoder;
  const parser = opts.parse ?? defaultParser;
  let fd: number | undefined;
  let closed = false;
  let buffer: string[] = [];
  let bufferBytes = 0;
  const bufferSize = opts.flushEveryN ?? 200;

  const flush = (flushOpts?: { durable?: boolean }): void => {
    if (closed) return;
    if (buffer.length === 0) return;

    if (fd == null) {
      mkdirSync(path.dirname(opts.filePath), { recursive: true });
      try {
        fd = openSync(opts.filePath, 'a');
      } catch (error) {
        throw new LineOutputError(
          `Failed to open file "${opts.filePath}" for flush`,
          error as Error,
        );
      }
    }

    const data = buffer.join('');
    buffer = [];
    bufferBytes = 0;

    try {
      writeSync(fd, data, undefined, 'utf8');
      if (flushOpts?.durable) {
        fsyncSync(fd);
      }
    } catch (error) {
      throw new LineOutputError(
        `Failed to flush buffer to file descriptor for "${opts.filePath}"`,
        error as Error,
      );
    }
  };

  const recoverTail = (): {
    skippedLines: string[];
  } | null => {
    if (!parser) return null;

    const skipped: string[] = [];
    for (let i = 0; i < 10; i++) {
      let fd: number;
      try {
        fd = openSync(opts.filePath, 'r+');
      } catch (error) {
        // File doesn't exist yet, nothing to recover
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return null;
        }
        throw error;
      }
      try {
        const { size } = fstatSync(fd);
        if (size === 0)
          return skipped.length ? { skippedLines: skipped } : null;

        const start = Math.max(0, size - 64 * 1024);
        const len = size - start;

        const buf = Buffer.allocUnsafe(len);
        readSync(fd, buf, 0, len, start);

        const text = buf.toString('utf8');

        const lastNl = text.lastIndexOf('\n');
        if (lastNl < 0)
          return skipped.length ? { skippedLines: skipped } : null;

        const last = text.slice(lastNl + 1).trim();
        if (!last) return skipped.length ? { skippedLines: skipped } : null;

        try {
          parser(last);
          return skipped.length ? { skippedLines: skipped } : null;
        } catch (err) {
          opts.onRecoverSkip?.(last, err);

          const truncatePos = start + (lastNl + 1);
          ftruncateSync(fd, truncatePos);

          skipped.push(last);
          continue;
        }
      } finally {
        closeSync(fd);
      }
    }

    return { skippedLines: skipped };
  };

  const recover = (): {
    skippedLines: string[];
  } => {
    if (fd != null) {
      try {
        closeSync(fd);
      } catch {}
      fd = undefined;
    }

    const tailResult = recoverTail();
    mkdirSync(path.dirname(opts.filePath), { recursive: true });
    try {
      fd = openSync(opts.filePath, 'a');
      closed = false;
    } catch (error) {
      throw new LineOutputError(
        `Failed to open file "${opts.filePath}" for appending`,
        error as Error,
      );
    }

    return {
      skippedLines: tailResult?.skippedLines ?? [],
    };
  };

  recover();

  return {
    filePath: opts.filePath,
    writeLine(obj: Encoded): void {
      if (closed) return;

      const encoded = encoder(obj);
      if (encoded === undefined) return;

      const lines = Array.isArray(encoded) ? encoded : [encoded];
      lines.forEach(line => {
        const lineWithNewline = `${line}\n`;
        buffer.push(lineWithNewline);
        bufferBytes += Buffer.byteLength(lineWithNewline, 'utf8');
      });

      if (
        buffer.length >= bufferSize ||
        (flushAfterBytes && bufferBytes >= flushAfterBytes)
      ) {
        this.flush();
      }
    },
    writeLineImmediate(obj: Encoded): void {
      if (closed) return;

      const encoded = encoder(obj);
      if (encoded === undefined) return;

      const lines = Array.isArray(encoded) ? encoded : [encoded];
      const data = lines.map(line => `${line}\n`).join('');

      if (fd == null) {
        mkdirSync(path.dirname(opts.filePath), { recursive: true });
        try {
          fd = openSync(opts.filePath, 'a');
        } catch (error) {
          throw new LineOutputError(
            `Failed to open file "${opts.filePath}" for immediate write`,
            error as Error,
          );
        }
      }

      try {
        writeSync(fd, data, undefined, 'utf8');
      } catch (error) {
        throw new LineOutputError(
          `Failed to write to file descriptor for "${opts.filePath}"`,
          error as Error,
        );
      }
    },
    flush,
    close(): void {
      if (closed) return;
      flush({ durable: true });
      closed = true;

      if (fd != null) {
        try {
          closeSync(fd);
        } catch (error) {
          throw new LineOutputError(
            `Failed to close file descriptor for "${opts.filePath}"`,
            error as Error,
          );
        }
        fd = undefined;
      }
    },
    recover,
  };
}
