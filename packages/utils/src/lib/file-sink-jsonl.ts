import * as fs from 'node:fs';
import { TextFileSink } from './file-sink-text.js';
import type { RecoverOptions, RecoverResult } from './sink-source.type.js';

/**
 * JSONL encoding functions - single source of truth for JSONL format.
 */
export const jsonlEncode = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  input: T,
): string => JSON.stringify(input);

export const jsonlDecode = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  raw: string,
): T => JSON.parse(raw) as T;

export function recoverJsonlFile<
  T extends Record<string, unknown> = Record<string, unknown>,
>(filePath: string, opts: RecoverOptions = {}): RecoverResult<T> {
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
        const record = jsonlDecode<T>(trimmedLine);
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

export type JsonlFileOptions<T = Record<string, unknown>> = {
  filePath: string;
  recover?: () => RecoverResult<T>;
  finalize?: () => void;
};

/**
 * JSONL writer using composition: Transport + Encoding + Recovery policy.
 * Writes are append-only.
 *
 * JsonlFile opens the underlying file lazily on first write and keeps it open
 * until close() or finalize() is called.
 *
 * Design rules:
 * - "Extend types only when substitutable"
 * - "Reuse behavior via composition"
 * - "Transport ≠ format ≠ recovery"
 */
export class JsonlFile<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  private file: TextFileSink;

  constructor(options: JsonlFileOptions<T>) {
    const { filePath } = options;
    this.file = new TextFileSink(filePath);

    // Recovery policy - JSONL-specific, customizable
    this.recover = options.recover ?? (() => recoverJsonlFile<T>(filePath));

    // Finalization policy - defaults to close() for cleanup
    this.finalize = options.finalize ?? (() => this.close());
  }

  /**
   * Encode record to JSONL format.
   */
  encode(record: T): string {
    return `${jsonlEncode(record)}\n`;
  }

  /**
   * Decode JSONL string to record.
   */
  decode(jsonlString: string): T {
    return jsonlDecode<T>(jsonlString);
  }

  /**
   * Open file for writing (no-op since TextFileSink opens lazily).
   */
  open(): void {
    // TextFileSink opens lazily on first write, so no-op here
  }

  /**
   * Write record in JSONL format (append-only).
   */
  write(record: T): void {
    this.file.append(`${jsonlEncode(record)}\n`);
  }

  /**
   * Read all records as parsed array (strict - throws on invalid JSON).
   */
  readAll(): T[] {
    return this.file
      .readAll()
      .split('\n')
      .filter(Boolean)
      .map(line => jsonlDecode<T>(line));
  }

  /**
   * Recover records with error handling (tolerant parsing).
   * Handles invalid records gracefully, returns errors alongside valid data.
   */
  recover: () => RecoverResult<T>;

  /**
   * Finalization - defaults to close() for cleanup.
   */
  finalize: () => void;

  /**
   * Get file path.
   */
  getPath(): string {
    return this.file.getPath();
  }

  /**
   * Close file.
   */
  close(): void {
    this.file.close();
  }

  /**
   * Repack file with clean JSONL formatting.
   */
  repack(outputPath?: string): void {
    const { records } = this.recover();
    fs.writeFileSync(
      outputPath ?? this.getPath(),
      `${records.map(jsonlEncode).join('\n')}\n`,
    );
  }
}
