import { bold, gray } from 'ansis';
import { type Options, bundleRequire } from 'bundle-require';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Format, PersistConfig } from '@code-pushup/models';
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

export function createReportPath({
  outputDir,
  filename,
  format,
  suffix,
}: Omit<Required<PersistConfig>, 'format' | 'report'> & {
  format: Format;
  suffix?: string;
}): string {
  return path.join(
    outputDir,
    suffix ? `${filename}-${suffix}.${format}` : `${filename}.${format}`,
  );
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

type SplitFilePath = {
  folders: string[];
  file: string;
};

export function splitFilePath(filePath: string): SplitFilePath {
  const file = path.basename(filePath);
  const folders: string[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for (
    // eslint-disable-next-line functional/no-let
    let dirPath = path.dirname(filePath);
    path.dirname(dirPath) !== dirPath;
    dirPath = path.dirname(dirPath)
  ) {
    // eslint-disable-next-line functional/immutable-data
    folders.unshift(path.basename(dirPath));
  }
  return { folders, file };
}
