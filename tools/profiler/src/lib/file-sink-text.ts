import * as fs from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { stringRecover } from './output-text';
import { type Recoverable } from './output.types';
import { type RecoverResult, type Sink } from './output.types';

export interface FileSinkOptions<I = any> {
  filePath: string;
  encode?: (input: I) => FileSinkText;
  decode?: (input: FileSinkText) => I;
  recover?: () => RecoverResult<I>;
  finalize?: () => void;
}

export type FileInput = Buffer | string;
export type FileOutput = string;
export type FileSinkText = string;

export class FileSink<I = FileInput> implements Sink<I, FileSink>, Recoverable {
  #fd: number | null = null;
  private options: FileSinkOptions<I>;

  constructor(options: FileSinkOptions<I>) {
    const filePath = options.filePath;

    this.options = {
      encode: (input: I) => {
        throw new Error('encode function must be provided');
      },
      decode: (output: FileOutput) => {
        throw new Error('decode function must be provided');
      },
      recover: () =>
        stringRecover(filePath, value => this.options.decode!(value)),
      finalize: () => this.close(),
      ...options,
    };
  }

  getFilePath(): string {
    return this.options.filePath;
  }

  open(): void {
    const dir = path.dirname(this.options.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.#fd = fs.openSync(this.options.filePath, 'a');
  }

  close(): void {
    if (this.#fd === null) return;
    fs.closeSync(this.#fd);
    this.#fd = null;
  }

  write(input: I): void {
    if (this.#fd === null) throw new Error('FileAdapter: not open');
    const encoded = this.encode(input);
    fs.writeSync(this.#fd, encoded as any);
  }

  encode(input: I): FileSink {
    return this.options.encode!(input);
  }

  decode(input: FileSink): I {
    return this.options.decode!(input);
  }

  recover(): RecoverResult<I> {
    return this.options.recover!();
  }

  repack(outputPath: string): void {
    const { records, errors, partialTail } = this.recover();
    fs.writeFileSync(outputPath, records.map(this.encode).join('\n'));
  }

  finalize(): void {
    this.options.finalize!();
  }
}
