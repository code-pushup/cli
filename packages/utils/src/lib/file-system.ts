import { bold, gray } from 'ansis';
import { type Options, bundleRequire } from 'bundle-require';
import * as fs from 'node:fs';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import * as readline from 'node:readline';
import type { SourceFileLocation } from '@code-pushup/models';
import { formatBytes } from './formatting.js';
import { logMultipleResults } from './log-results.js';
import { ui } from './logging.js';

export async function readTextFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return buffer.toString();
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const text = await readTextFile(filePath);
  return JSON.parse(text) as T;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

export async function directoryExists(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function ensureDirectoryExists(baseDir: string) {
  try {
    await mkdir(baseDir, { recursive: true });
    return;
  } catch (error) {
    ui().logger.info((error as { code: string; message: string }).message);
    if ((error as { code: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function removeDirectoryIfExists(dir: string) {
  if (await directoryExists(dir)) {
    await rm(dir, { recursive: true, force: true });
  }
}

export type FileResult = readonly [string] | readonly [string, number];
export type MultipleFileResults = PromiseSettledResult<FileResult>[];

export function logMultipleFileResults(
  fileResults: MultipleFileResults,
  messagePrefix: string,
): void {
  const succeededTransform = (result: PromiseFulfilledResult<FileResult>) => {
    const [fileName, size] = result.value;
    const formattedSize = size ? ` (${gray(formatBytes(size))})` : '';
    return `- ${bold(fileName)}${formattedSize}`;
  };
  const failedTransform = (result: PromiseRejectedResult) =>
    `- ${bold(result.reason as string)}`;

  logMultipleResults<FileResult>(
    fileResults,
    messagePrefix,
    succeededTransform,
    failedTransform,
  );
}

export async function importModule<T = unknown>(options: Options): Promise<T> {
  const { mod } = await bundleRequire<object>(options);

  if (typeof mod === 'object' && 'default' in mod) {
    return mod.default as T;
  }
  return mod as T;
}

export function pluginWorkDir(slug: string): string {
  return path.join('node_modules', '.code-pushup', slug);
}

export type CrawlFileSystemOptions<T> = {
  directory: string;
  pattern?: string | RegExp;
  fileTransform?: (filePath: string) => Promise<T> | T;
};

export async function crawlFileSystem<T = string>(
  options: CrawlFileSystemOptions<T>,
): Promise<T[]> {
  const {
    directory,
    pattern,
    fileTransform = (filePath: string) => filePath as T,
  } = options;

  const files = await readdir(directory);
  const promises = files.map(async (file): Promise<T | T[]> => {
    const filePath = path.join(directory, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      return crawlFileSystem({ directory: filePath, pattern, fileTransform });
    }
    if (stats.isFile() && (!pattern || new RegExp(pattern).test(file))) {
      return fileTransform(filePath);
    }
    return [];
  });

  const resultsNestedArray = await Promise.all(promises);
  return resultsNestedArray.flat() as T[];
}

export async function findNearestFile(
  fileNames: string[],
  cwd = process.cwd(),
): Promise<string | undefined> {
  // eslint-disable-next-line functional/no-loop-statements
  for (
    // eslint-disable-next-line functional/no-let
    let directory = cwd;
    directory !== path.dirname(directory);
    directory = path.dirname(directory)
  ) {
    // eslint-disable-next-line functional/no-loop-statements
    for (const file of fileNames) {
      if (await fileExists(path.join(directory, file))) {
        return path.join(directory, file);
      }
    }
  }
  return undefined;
}

export function findLineNumberInText(
  content: string,
  pattern: string,
): number | null {
  const lines = content.split(/\r?\n/); // Split lines, handle both Windows and UNIX line endings

  const lineNumber = lines.findIndex(line => line.includes(pattern)) + 1; // +1 because line numbers are 1-based
  return lineNumber === 0 ? null : lineNumber; // If the package isn't found, return null
}

export function filePathToCliArg(filePath: string): string {
  // needs to be escaped if spaces included
  return `"${filePath}"`;
}

export function projectToFilename(project: string): string {
  return project.replace(/[/\\\s]+/g, '-').replace(/@/g, '');
}

export type LineHit = {
  startColumn: number;
  endColumn: number;
};

export type FileHit = Pick<SourceFileLocation, 'file'> &
  Exclude<SourceFileLocation['position'], undefined>;

const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ensureGlobalRegex = (pattern: RegExp): RegExp =>
  new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
  );

const findAllMatches = (
  line: string,
  searchPattern: string | RegExp | ((line: string) => LineHit[] | null),
): LineHit[] => {
  if (typeof searchPattern === 'string') {
    return [...line.matchAll(new RegExp(escapeRegExp(searchPattern), 'g'))].map(
      ({ index = 0 }) => ({
        startColumn: index,
        endColumn: index + searchPattern.length,
      }),
    );
  }

  if (searchPattern instanceof RegExp) {
    return [...line.matchAll(ensureGlobalRegex(searchPattern))].map(
      ({ index = 0, 0: match }) => ({
        startColumn: index,
        endColumn: index + match.length,
      }),
    );
  }

  return searchPattern(line) || [];
};

/**
 * Reads a file line-by-line and checks if it contains the search pattern.
 * @param file - The file path to check.
 * @param searchPattern - The pattern to match.
 * @param options - Additional options. If true, the search will stop after the first hit.
 * @returns Promise<FileHit[]> - List of hits with matching details.
 */
export async function findInFile(
  file: string,
  searchPattern: string | RegExp | ((line: string) => LineHit[] | null),
  options?: { bail?: boolean },
): Promise<FileHit[]> {
  const { bail = false } = options || {};
  const hits: FileHit[] = [];

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream });
    // eslint-disable-next-line functional/no-let
    let lineNumber = 0;
    // eslint-disable-next-line functional/no-let
    let isResolved = false;

    rl.on('line', line => {
      lineNumber++;
      const matches = findAllMatches(line, searchPattern);

      matches.forEach(({ startColumn, endColumn }) => {
        // eslint-disable-next-line functional/immutable-data
        hits.push({
          file,
          startLine: lineNumber,
          startColumn,
          endLine: lineNumber,
          endColumn,
        });

        if (bail && !isResolved) {
          isResolved = true;
          stream.destroy();
          resolve(hits);
        }
      });
    });
    rl.once('close', () => {
      if (!isResolved) {
        isResolved = true;
      }
      resolve(hits); // Resolve only once after closure
    });

    rl.once('error', error => {
      if (!isResolved) {
        isResolved = true;
        reject(error);
      }
    });
  });
}
