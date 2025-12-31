import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Error thrown by line output operations
 */
export class LineOutputError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'LineOutputError';
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Options for creating a line output instance
 */
export interface LineOutputOptions<T, P> {
  filePath: string;
  flushEveryN?: number;
  recoverExisting?: boolean;
  parse?: (line: string) => T;
  encode: (obj: T) => string[];
}

/**
 * Line output interface for writing data line by line to a file
 */
export interface LineFileOutput<T> {
  writeLine(obj: T): void;
  writeLineImmediate(obj: T): void;
  flush(): void;
  close(): void;
}

/**
 * Create a line output instance for writing data to a file line by line.
 * Supports buffering, flushing, and recovery of existing files.
 */
export function createLineFileOutput<T, P = unknown>(
  options: LineOutputOptions<T, P>,
): LineFileOutput<T> {
  const {
    filePath,
    flushEveryN = 20,
    recoverExisting = true,
    parse,
    encode,
  } = options;

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    throw new LineOutputError(`Directory does not exist: ${dir}`);
  }

  let buffer: string[] = [];
  let writeCount = 0;
  let closed = false;

  // Recovery: if file exists and recoverExisting is true, try to read and validate existing content
  if (recoverExisting && existsSync(filePath)) {
    try {
      const existingContent = readFileSync(filePath, 'utf8');
      if (existingContent.trim() && parse) {
        const lines = existingContent.trim().split('\n');
        const validLines: string[] = [];

        for (const line of lines) {
          try {
            parse(line); // Validate by parsing
            validLines.push(line);
          } catch {
            // Skip invalid lines during recovery
          }
        }

        if (validLines.length > 0) {
          writeFileSync(filePath, validLines.join('\n') + '\n', 'utf8');
        }
      }
    } catch (error) {
      throw new LineOutputError(
        `Failed to recover existing file "${filePath}"`,
        error as Error,
      );
    }
  }

  const writeLines = (lines: string[], immediate = false) => {
    if (closed) return;

    try {
      if (immediate || buffer.length + lines.length >= flushEveryN) {
        // Include buffered lines plus new lines
        const allLines = [...buffer, ...lines];
        const content = allLines.join('\n') + '\n';
        writeFileSync(filePath, content, { flag: 'a' });
        buffer = [];
      } else {
        buffer.push(...lines);
      }
      writeCount += lines.length;
    } catch (error) {
      throw new LineOutputError(
        `Failed to write to file "${filePath}"`,
        error as Error,
      );
    }
  };

  return {
    writeLine(obj: T): void {
      if (closed) return;
      const lines = encode(obj);
      writeLines(lines, false);
    },

    writeLineImmediate(obj: T): void {
      if (closed) return;
      const lines = encode(obj);
      writeLines(lines, true);
    },

    flush(): void {
      if (closed || buffer.length === 0) return;

      try {
        writeFileSync(filePath, buffer.join('\n') + '\n', { flag: 'a' });
        buffer = [];
      } catch (error) {
        throw new LineOutputError(
          `Failed to flush to file "${filePath}"`,
          error as Error,
        );
      }
    },

    close(): void {
      if (closed) return;
      closed = true;

      // Flush any remaining buffer
      if (buffer.length > 0) {
        try {
          writeFileSync(filePath, buffer.join('\n') + '\n', { flag: 'a' });
          buffer = [];
        } catch (error) {
          throw new LineOutputError(
            `Failed to flush on close for file "${filePath}"`,
            error as Error,
          );
        }
      }
    },
  };
}
