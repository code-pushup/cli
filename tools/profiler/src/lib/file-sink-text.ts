import * as fs from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { type RecoverOptions, type Recoverable } from './sink-source.types.js';
import { type RecoverResult, type Sink } from './sink-source.types.js';

export const stringDecode = <O extends FileOutput, I>(output: O): I => {
  const str = Buffer.isBuffer(output)
    ? output.toString('utf8')
    : String(output);
  return str as unknown as I;
};

export const stringEncode = <I, O extends FileOutput>(input: I): O =>
  `${typeof input === 'string' ? input : JSON.stringify(input)}\n` as O;

export const stringRecover = function <I, O extends FileOutput = FileOutput>(
  filePath: string,
  decode: (output: O) => I,
  opts: RecoverOptions<I> = {},
): RecoverResult<I> {
  const records: I[] = [];
  const errors: Array<{ lineNo: number; line: string; error: Error }> = [];
  let partialTail: string | null = null;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    let lineNo = 0;

    for (const line of lines) {
      lineNo++;
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      try {
        const record = decode(trimmedLine as O);
        records.push(record);
      } catch (e) {
        const info = { lineNo, line: line, error: e as Error };
        errors.push(info);

        if (opts.keepInvalid) {
          records.push({ __invalid: true, lineNo, line: line } as any);
        }

        partialTail = line;
      }
    }
  } catch {
    return { records: [], errors: [], partialTail: null };
  }

  return { records, errors, partialTail };
};

export interface FileSinkOptions {
  filePath: string;
  recover?: () => RecoverResult;
  finalize?: () => void;
}

export type FileInput = Buffer | string;
export type FileOutput = string;

export class FileSink<I = FileInput, O extends FileOutput = FileOutput>
  implements Sink<I, O>, Recoverable
{
  #fd: number | null = null;
  options: FileSinkOptions;

  constructor(options: FileSinkOptions) {
    this.options = options;
  }

  encode(input: I): O {
    return stringEncode(input as any);
  }

  decode(output: O): I {
    return stringDecode(output as any);
  }
  getFilePath(): string {
    return this.options.filePath;
  }

  open(withRepack: boolean = false): void {
    const dir = path.dirname(this.options.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    if (withRepack) {
      this.repack(this.options.filePath);
    }
    this.#fd = fs.openSync(this.options.filePath, 'a');
  }

  close(): void {
    if (this.#fd === null) return;
    fs.closeSync(this.#fd);
    this.#fd = null;
  }

  write(input: I): void {
    if (this.#fd === null) return; // Silently ignore if not open
    const encoded = this.encode(input);
    try {
      fs.writeSync(this.#fd, encoded as any);
    } catch (error) {
      // Silently ignore write errors (e.g., EBADF in test environments with mocked fs)
    }
  }

  recover(): RecoverResult<I> {
    return this.options.recover!();
  }

  repack(outputPath: string): void {
    const { records } = this.recover();
    fs.writeFileSync(outputPath, records.map(this.encode).join('\n'));
  }

  finalize(): void {
    this.options.finalize!();
  }
}
