import { type Options, bundleRequire } from 'bundle-require';
import chalk from 'chalk';
import { mkdir, readFile } from 'fs/promises';
import { logMultipleResults } from './log-results';
import { formatBytes } from './report';

export function toUnixPath(
  path: string,
  options?: { toRelative?: boolean },
): string {
  const unixPath = path.replace(/\\/g, '/');

  if (options?.toRelative) {
    return unixPath.replace(process.cwd().replace(/\\/g, '/') + '/', '');
  }

  return unixPath;
}

export async function ensureDirectoryExists(baseDir: string) {
  try {
    await mkdir(baseDir, { recursive: true });
    return;
  } catch (error) {
    console.log((error as { code: string; message: string }).message);
    if ((error as { code: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function readTextFile(path: string): Promise<string> {
  const buffer = await readFile(path);
  return buffer.toString();
}

export async function readJsonFile<T = unknown>(path: string): Promise<T> {
  const text = await readTextFile(path);
  return JSON.parse(text);
}

export type FileResult = readonly [string] | readonly [string, number];
export type MultipleFileResults = PromiseSettledResult<FileResult>[];

export function logMultipleFileResults(
  persistResult: MultipleFileResults,
  messagePrefix: string,
): void {
  const succeededCallback = (result: PromiseFulfilledResult<FileResult>) => {
    const [fileName, size] = result.value;
    console.log(
      `- ${chalk.bold(fileName)}` +
        (size ? ` (${chalk.gray(formatBytes(size))})` : ''),
    );
  };
  const failedCallback = (result: PromiseRejectedResult) => {
    console.log(`- ${chalk.bold(result.reason)}`);
  };

  logMultipleResults<FileResult>(
    persistResult,
    messagePrefix,
    succeededCallback,
    failedCallback,
  );
}

export class NoExportError extends Error {
  constructor(filepath: string) {
    super(`No export found in ${filepath}`);
  }
}

export async function importEsmModule<T = unknown>(
  options: Options,
  parse?: (d: unknown) => T,
) {
  parse = parse || (v => v as T);
  options = {
    format: 'esm',
    ...options,
  };

  const { mod } = await bundleRequire(options);
  if (mod.default === undefined) {
    throw new NoExportError(options.filepath);
  }
  return parse(mod.default);
}
