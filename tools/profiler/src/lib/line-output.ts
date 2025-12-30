import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export class LineOutputError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'LineOutputError';
  }
}

export interface LineOutputOptions<TInput, TParsed> {
  filePath: string;
  flushEveryN?: number;
  restoreFromExisting?: boolean;
  parse: (line: string) => TParsed;
  encode: (obj: TInput) => string[];
}

export interface LineOutputRecoveryResult {
  skippedLines: number;
}

export interface LineOutput<TInput, TParsed> {
  writeLine(obj: TInput): void;
  writeLineImmediate(obj: TInput): void;
  flush(): void;
  close(): void;
  recover(): LineOutputRecoveryResult;
}

/**
 * Create a line-based output utility that buffers writes and supports recovery.
 * Handles encoding objects to lines, buffering, and recovery from incomplete writes.
 */
export function createLineOutput<TInput, TParsed>(
  options: LineOutputOptions<TInput, TParsed>,
): LineOutput<TInput, TParsed> {
  const {
    filePath,
    flushEveryN = 100,
    restoreFromExisting = false,
    parse,
    encode,
  } = options;

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Clear existing file if restoreFromExisting is false
  if (!restoreFromExisting && existsSync(filePath)) {
    try {
      writeFileSync(filePath, '', 'utf8');
    } catch (error) {
      throw new LineOutputError(
        `Failed to clear existing file "${filePath}"`,
        error as Error,
      );
    }
  }

  let buffer: string[] = [];
  let closed = false;

  const flushBuffer = () => {
    if (buffer.length === 0) return;

    const content = buffer.join('\n') + '\n';
    try {
      writeFileSync(filePath, content, { flag: 'a' });
      buffer = [];
    } catch (error) {
      throw new LineOutputError(
        `Failed to write to file "${filePath}"`,
        error as Error,
      );
    }
  };

  return {
    writeLine(obj: TInput): void {
      if (closed) return;

      const lines = encode(obj);
      buffer.push(...lines);

      if (buffer.length >= flushEveryN) {
        flushBuffer();
      }
    },

    writeLineImmediate(obj: TInput): void {
      if (closed) return;

      // Flush any pending buffer first
      flushBuffer();

      const lines = encode(obj);
      const content = lines.join('\n') + '\n';

      try {
        writeFileSync(filePath, content, { flag: 'a' });
      } catch (error) {
        throw new LineOutputError(
          `Failed to write immediately to file "${filePath}"`,
          error as Error,
        );
      }
    },

    flush(): void {
      if (closed) return;
      flushBuffer();
    },

    close(): void {
      if (closed) return;
      closed = true;
      flushBuffer();
    },

    recover(): LineOutputRecoveryResult {
      let skippedLines = 0;

      try {
        if (!existsSync(filePath)) {
          return { skippedLines: 0 };
        }

        if (!restoreFromExisting) {
          // Delete existing file instead of restoring
          try {
            writeFileSync(filePath, '', 'utf8');
          } catch (error) {
            throw new LineOutputError(
              `Failed to clear existing file "${filePath}"`,
              error as Error,
            );
          }
          return { skippedLines: 0 };
        }

        const content = readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        // Validate each line can be parsed
        const validLines: string[] = [];

        for (const line of lines) {
          try {
            parse(line);
            validLines.push(line);
          } catch {
            skippedLines++;
          }
        }

        // Rewrite file with only valid lines
        if (validLines.length !== lines.length) {
          const validContent = validLines.join('\n') + '\n';
          writeFileSync(filePath, validContent, 'utf8');
        }

        return { skippedLines };
      } catch (error) {
        throw new LineOutputError(
          `Failed to recover file "${filePath}"`,
          error as Error,
        );
      }
    },
  };
}
