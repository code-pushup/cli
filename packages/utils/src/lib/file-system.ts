import { type Options, bundleRequire } from 'bundle-require';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Format, PersistConfig } from '@code-pushup/models';
import { logger } from './logger.js';
import { profiler } from './profiler.js';
import { settlePromise } from './promises.js';

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
    const fsError = error as NodeJS.ErrnoException;
    logger.warn(fsError.message);
    if (fsError.code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function removeDirectoryIfExists(dir: string) {
  if (await directoryExists(dir)) {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function importModule<T = unknown>(options: Options): Promise<T> {
  return profiler.span(
    'importModule',
    async () => {
      const resolvedStats = await settlePromise(stat(options.filepath));
      if (resolvedStats.status === 'rejected') {
        throw new Error(`File '${options.filepath}' does not exist`);
      }
      if (!resolvedStats.value.isFile()) {
        throw new Error(`Expected '${options.filepath}' to be a file`);
      }

      const { mod } = await bundleRequire<object>(options);

      if (typeof mod === 'object' && 'default' in mod) {
        return mod.default as T;
      }
      return mod as T;
    },
    { detail: profiler.spans.cli() },
  );
}

export function createReportPath({
  outputDir,
  filename,
  format,
  suffix,
}: Pick<Required<PersistConfig>, 'filename' | 'outputDir'> & {
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
  return profiler.span(
    'crawlFileSystem',
    async () => {
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
          return crawlFileSystem({
            directory: filePath,
            pattern,
            fileTransform,
          });
        }
        if (stats.isFile() && (!pattern || new RegExp(pattern).test(file))) {
          return fileTransform(filePath);
        }
        return [];
      });

      const resultsNestedArray = await Promise.all(promises);
      return resultsNestedArray.flat() as T[];
    },
    { detail: profiler.spans.cli() },
  );
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

export function truncatePaths(paths: string[]): string[] {
  const segmentedPaths = paths
    .map(splitFilePath)
    .map(({ folders, file }): string[] => [...folders, file]);

  const first = segmentedPaths[0];
  const others = segmentedPaths.slice(1);
  if (!first) {
    return paths;
  }

  /* eslint-disable functional/no-let,functional/no-loop-statements,unicorn/no-for-loop */
  let offsetLeft = 0;
  let offsetRight = 0;
  for (let left = 0; left < first.length; left++) {
    if (others.every(segments => segments[left] === first[left])) {
      offsetLeft++;
    } else {
      break;
    }
  }
  for (let right = 1; right <= first.length; right++) {
    if (others.every(segments => segments.at(-right) === first.at(-right))) {
      offsetRight++;
    } else {
      break;
    }
  }
  /* eslint-enable functional/no-let,functional/no-loop-statements,unicorn/no-for-loop */

  return segmentedPaths.map(segments => {
    const uniqueSegments = segments.slice(
      offsetLeft,
      offsetRight > 0 ? -offsetRight : undefined,
    );
    return path.join(
      offsetLeft > 0 ? '…' : '',
      ...uniqueSegments,
      offsetRight > 0 ? '…' : '',
    );
  });
}
