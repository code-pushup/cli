import * as fs from 'node:fs';
import * as readline from 'node:readline';
import { type FileInput, type FileOutput, FileSink } from './output';
import { stringDecode, stringEncode, stringRecover } from './output-text';
import {
  type OutputOptions,
  type RecoverOptions,
  type RecoverResult,
} from './output.types';

export const jsonlEncode = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  input: T,
): FileOutput => stringEncode<T>(input);

export const jsonlDecode = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  output: FileOutput,
): T => JSON.parse(stringDecode(output.trim())) as T;

/**
 * Recover JSONL records from a file.
 * - Streaming, line-by-line
 * - Skips invalid lines but records errors
 * - Detects partial/truncated tail
 */
export async function recoverJsonlFile<
  T extends Record<string, unknown> = Record<string, unknown>,
>(filePath: string, opts: RecoverOptions<T> = {}): Promise<RecoverResult<T>> {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  const records: T[] = [];
  const errors: Array<{ lineNo: number; line: string; error: Error }> = [];
  let lineNo = 0;

  let partialTail: string | null = null;

  for await (const lineRaw of rl) {
    lineNo++;
    const line = lineRaw.trim();
    if (!line) continue;

    try {
      const record = jsonlDecode<T>(line);
      records.push(record);
    } catch (e) {
      const info = { lineNo, line: lineRaw, error: e as Error };
      errors.push(info);

      if (opts.keepInvalid) {
        records.push({
          __invalid: true,
          lineNo,
          line: lineRaw,
        } as unknown as T);
      }

      partialTail = lineRaw;
    }
  }

  return { records, errors, partialTail };
}

/**
 * Synchronous JSONL recovery using string-based processing
 */
export function recoverJsonlFileSync<
  T extends Record<string, unknown> = Record<string, unknown>,
>(filePath: string, opts: RecoverOptions<T> = {}): RecoverResult<T> {
  return stringRecover(
    filePath,
    (input: FileInput) => jsonlDecode<T>(input as string),
    opts,
  );
}

export async function repackJsonl<
  T extends Record<string, unknown> = Record<string, unknown>,
>(inputPath: string, outputPath: string): Promise<RecoverResult<T>> {
  const out = fs.createWriteStream(outputPath, {
    flags: 'w',
    encoding: 'utf8',
  });

  const recoveryResult = await recoverJsonlFile<T>(inputPath);

  for (const record of recoveryResult.records) {
    if (record && record['__invalid']) continue;
    out.write(JSON.stringify(record) + '\n');
  }

  await new Promise<void>((res, rej) =>
    out.end((err: Error) => (err ? rej(err) : res())),
  );

  return recoveryResult;
}

export function createJsonlFileOutput<
  T extends Record<string, unknown> = Record<string, unknown>,
>(options: OutputOptions<T, FileOutput>): FileSink<T> {
  const { filePath, flushEveryN = 20, ...fileOptions } = options;

  const jsonlOptions = {
    encode: stringEncode<T>,
    decode: jsonlDecode<T>,
    recover: () => recoverJsonlFileSync<T>(filePath),
    finalize: () => {},
    ...fileOptions,
  };

  const fileAdapter = new FileSink<T>({
    filePath,
    ...jsonlOptions,
  });

  return fileAdapter;
}
