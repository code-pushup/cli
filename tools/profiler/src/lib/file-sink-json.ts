import * as fs from 'node:fs';
import {
  type FileInput,
  type FileOutput,
  FileSink,
  type FileSinkOptions,
  stringDecode,
  stringEncode,
  stringRecover,
} from './file-sink-text';
import {
  type RecoverOptions,
  type RecoverResult,
} from './sink-source.types.js';

export const jsonlEncode = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  input: T,
): FileOutput => `${JSON.stringify(input)}\n`;

export const jsonlDecode = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  output: FileOutput,
): T => JSON.parse(stringDecode(output.trim())) as T;

export function recoverJsonlFile<
  T extends Record<string, unknown> = Record<string, unknown>,
>(filePath: string, opts: RecoverOptions<T> = {}): RecoverResult<T> {
  return stringRecover(
    filePath,
    (input: FileInput) => jsonlDecode<T>(input as string),
    opts,
  );
}

export class JsonlFileSink<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends FileSink<T> {
  constructor(options: FileSinkOptions<T>) {
    const { filePath, ...fileOptions } = options;
    super({
      ...fileOptions,
      filePath,
      recover: () => recoverJsonlFile<T>(filePath),
      finalize: () => {},
    });
  }

  override encode(input: T): FileOutput {
    return jsonlEncode(input);
  }
  override decode(output: FileOutput): T {
    return JSON.parse(output.trim()) as T;
  }
}
