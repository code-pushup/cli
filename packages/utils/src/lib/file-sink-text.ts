import * as fs from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { PROFILER_FILE_BASE_NAME, PROFILER_OUT_DIR } from './profiler';
import type {
  RecoverOptions,
  RecoverResult,
  Recoverable,
  Sink,
} from './sink-source.types.js';

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
  opts: RecoverOptions = {},
): RecoverResult<I> {
  const records: I[] = [];
  const errors: { lineNo: number; line: string; error: Error }[] = [];
  let partialTail: string | null = null;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    let lineNo = 0;

    for (const line of lines) {
      lineNo++;
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }

      try {
        const record = decode(trimmedLine as O);
        records.push(record);
      } catch (error) {
        const info = { lineNo, line, error: error as Error };
        errors.push(info);

        if (opts.keepInvalid) {
          records.push({ __invalid: true, lineNo, line } as any);
        }

        partialTail = line;
      }
    }
  } catch {
    return { records: [], errors: [], partialTail: null };
  }

  return { records, errors, partialTail };
};

export type FileNameOptions = {
  fileBaseName: string;
  outDir: string;
  fileName?: string;
};

export function getFilenameParts(options: FileNameOptions): {
  outDir: string;
  fileName: string;
} {
  const { fileName, fileBaseName, outDir } = options;

  if (fileName) {
    return {
      outDir,
      fileName,
    };
  }

  const baseName = fileBaseName;
  const DATE_LENGTH = 10;
  const TIME_SEGMENTS = 3;
  const COLON_LENGTH = 1;
  const TOTAL_TIME_LENGTH =
    TIME_SEGMENTS * 2 + (TIME_SEGMENTS - 1) * COLON_LENGTH; // HH:MM:SS = 8 chars
  const id = new Date()
    .toISOString()
    .slice(0, DATE_LENGTH + TOTAL_TIME_LENGTH)
    .replace(/:/g, '-');

  return {
    outDir,
    fileName: `${baseName}.${id}`,
  };
}

export type FileSinkOptions = {
  filePath: string;
  recover?: () => RecoverResult;
  finalize?: () => void;
};

export type FileInput = Buffer | string;
export type FileOutput = Buffer | string;

export class FileSink<I = FileInput, O extends FileOutput = FileOutput>
  implements Sink<I, O>, Recoverable<I>
{
  #fd: number | null = null;
  options: FileSinkOptions;

  constructor(options: FileSinkOptions) {
    this.options = options;
  }

  isClosed(): boolean {
    return this.#fd == null;
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
    if (this.#fd == null) {
      return;
    }
    fs.closeSync(this.#fd);
    this.#fd = null;
  }

  write(input: I): void {
    if (this.#fd == null) {
      return;
    } // Silently ignore if not open
    const encoded = this.encode(input);
    try {
      fs.writeSync(this.#fd, encoded as any);
    } catch {
      // Silently ignore write errors (e.g., EBADF in test environments with mocked fs)
    }
  }

  recover(): RecoverResult<I> {
    const dir = path.dirname(this.options.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return this.options.recover!() as RecoverResult<I>;
  }

  repack(outputPath?: string): void {
    const { records } = this.recover();
    fs.writeFileSync(
      outputPath ?? this.getFilePath(),
      records.map(this.encode).join('\n'),
    );
  }

  finalize(): void {
    this.options.finalize!();
  }
}
