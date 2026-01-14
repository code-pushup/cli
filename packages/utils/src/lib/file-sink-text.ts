/**
 * Simple Text File Sink
 *
 * Basic file operations for text files. Used as the foundation for format-specific writers.
 * If you need JSONL files, use JsonlFile from file-sink-jsonl.ts instead.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RecoverOptions, RecoverResult } from './sink-source.type.js';

/**
 * Simple text file sink - reusable for basic file operations.
 * One responsibility: append text, read all text, get path.
 */
export class TextFileSink {
  #fd: number | null = null;

  constructor(private filePath: string) {}

  /**
   * Append text to file (append-only).
   */
  append(text: string): void {
    // Lazy open on first write
    if (this.#fd === null) {
      const dir = path.dirname(this.filePath);
      fs.mkdirSync(dir, { recursive: true });
      this.#fd = fs.openSync(this.filePath, 'a');
    }
    fs.writeSync(this.#fd, text);
  }

  /**
   * Read entire file as string.
   */
  readAll(): string {
    try {
      return fs.readFileSync(this.filePath, 'utf8');
    } catch {
      return '';
    }
  }

  /**
   * Get file path.
   */
  getPath(): string {
    return this.filePath;
  }

  /**
   * Close file descriptor.
   */
  close(): void {
    if (this.#fd !== null) {
      fs.closeSync(this.#fd);
      this.#fd = null;
    }
  }
}

/**
 * String encoding functions - single source of truth for string format.
 */
export const stringEncode = (input: unknown): string => {
  if (typeof input === 'string') {
    return `${input}\n`;
  }
  return `${JSON.stringify(input)}\n`;
};

export const stringDecode = (input: string | Buffer): string => {
  if (Buffer.isBuffer(input)) {
    return input.toString('utf8');
  }
  return input;
};

export function stringRecover<T = string>(
  filePath: string,
  decodeFn: (line: string) => T,
  opts: RecoverOptions = {},
): RecoverResult<T> {
  const records: T[] = [];
  const errors: { lineNo: number; line: string; error: Error }[] = [];
  let partialTail: string | null = null;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let lineNo = 0;

    for (const line of lines) {
      lineNo++;
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }

      try {
        const record = decodeFn(trimmedLine);
        records.push(record);
      } catch (error) {
        const info = { lineNo, line, error: error as Error };
        errors.push(info);

        if (opts.keepInvalid) {
          records.push({ __invalid: true, lineNo, line } as any);
        }

        partialTail = line;
      }

      // Optional: perfect tail detection for empty lines at EOF
      if (trimmedLine === '' && lineNo === lines.length) {
        partialTail = line;
      }
    }
  } catch {
    return { records: [], errors: [], partialTail: null };
  }

  return { records, errors, partialTail };
}

export type FileSinkOptions<T = string> = {
  filePath: string;
  recover?: () => RecoverResult<T>;
  finalize?: () => void;
};

/**
 * String file sink using composition: Transport + Encoding + Recovery policy.
 * Writes are append-only.
 *
 * FileSink opens the underlying file lazily on first write and keeps it open
 * until close() or finalize() is called.
 *
 * Design rules:
 * - "Extend types only when substitutable"
 * - "Reuse behavior via composition"
 * - "Transport ≠ format ≠ recovery"
 */
export class FileSink<T = string> {
  private file: TextFileSink;
  private isOpen = false;
  private fd: number | null = null;

  constructor(public options: FileSinkOptions<T>) {
    const { filePath } = options;
    this.file = new TextFileSink(filePath);

    // Recovery policy - string-specific, customizable
    this.recover =
      options.recover ??
      (() => stringRecover<T>(filePath, (line: string) => line as T));

    // Finalization policy - defaults to close() for cleanup
    this.finalize = options.finalize ?? (() => this.close());
  }

  /**
   * Encode input to string format.
   */
  encode(input: T): string {
    return stringEncode(input);
  }

  /**
   * Decode string to output type.
   */
  decode(output: string | Buffer): T {
    const str = stringDecode(output);
    return str as T;
  }

  /**
   * Get file path.
   */
  getFilePath(): string {
    return this.file.getPath();
  }

  /**
   * Open file for writing (creates directory if needed).
   */
  open(withRepack?: boolean): void {
    if (this.isOpen) return;

    const dir = path.dirname(this.file.getPath());
    fs.mkdirSync(dir, { recursive: true });

    if (withRepack) {
      this.repack(this.file.getPath());
    }

    this.fd = fs.openSync(this.file.getPath(), 'a');
    this.isOpen = true;
  }

  /**
   * Write input to file (append-only).
   */
  write(input: T): void {
    if (!this.isOpen) return;

    try {
      const encoded = this.encode(input);
      fs.writeSync(this.fd!, encoded);
    } catch {
      // Silently ignore write errors
    }
  }

  /**
   * Close file descriptor.
   */
  close(): void {
    if (this.fd !== null) {
      fs.closeSync(this.fd);
      this.fd = null;
    }
    this.isOpen = false;
  }

  /**
   * Check if sink is closed.
   */
  isClosed(): boolean {
    return !this.isOpen;
  }

  /**
   * Recover records with error handling (tolerant parsing).
   * Handles invalid records gracefully, returns errors alongside valid data.
   */
  recover: () => RecoverResult<T>;

  /**
   * Repack file with clean formatting.
   */
  repack(outputPath?: string): void {
    const { records } = this.recover();
    const targetPath = outputPath ?? this.getFilePath();
    const dir = path.dirname(targetPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      targetPath,
      records.map(record => this.encode(record)).join(''),
    );
  }

  /**
   * Finalization - defaults to close() for cleanup.
   */
  finalize: () => void;
}
