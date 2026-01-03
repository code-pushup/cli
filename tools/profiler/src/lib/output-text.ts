import * as fs from 'node:fs';
import { type FileInput, type FileOutput } from './output';
import { type RecoverOptions, type RecoverResult } from './output.types';

export const stringDecode = (input: FileInput): FileOutput => {
  return Buffer.isBuffer(input) ? input.toString('utf8') : String(input);
};

export const stringEncode = <T>(input: T) =>
  (typeof input === 'string' ? input : JSON.stringify(input)) + '\n';

export const stringRecover = function <T>(
  filePath: string,
  decode: (output: FileOutput) => T,
  opts: RecoverOptions<T> = {},
): RecoverResult<T> {
  const records: T[] = [];
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
        const record = decode(trimmedLine);
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
