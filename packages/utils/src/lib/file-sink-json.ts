import * as fs from 'node:fs';
import {
  type FileOutput,
  FileSink,
  type FileSinkOptions,
  stringDecode,
  stringEncode,
  stringRecover,
} from './file-sink-text.js';
import type { RecoverOptions, RecoverResult } from './sink-source.types.js';

export const jsonlEncode = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  input: T,
): FileOutput => JSON.stringify(input);

export const jsonlDecode = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  output: FileOutput,
): T => JSON.parse(stringDecode(output)) as T;

export function recoverJsonlFile<
  T extends Record<string, unknown> = Record<string, unknown>,
>(filePath: string, opts: RecoverOptions = {}): RecoverResult<T> {
  return stringRecover(filePath, jsonlDecode<T>, opts);
}

export class JsonlFileSink<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends FileSink<T> {
  constructor(options: FileSinkOptions) {
    const { filePath, ...fileOptions } = options;
    super({
      ...fileOptions,
      filePath,
      recover: () => recoverJsonlFile<T>(filePath),
      finalize: () => {
        // No additional finalization needed for JSONL files
      },
    });
  }

  override encode(input: T): FileOutput {
    return stringEncode(jsonlEncode(input));
  }

  override decode(output: FileOutput): T {
    return jsonlDecode(stringDecode(output));
  }

  override repack(outputPath?: string): void {
    const { records } = this.recover();
    fs.writeFileSync(
      outputPath ?? this.getFilePath(),
      records.map(this.encode).join(''),
    );
  }
}
