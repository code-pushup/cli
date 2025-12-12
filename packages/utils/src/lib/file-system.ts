import { createJiti } from 'jiti';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import type { Format, PersistConfig } from '@code-pushup/models';
import { logger } from './logger.js';
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

export async function importModule<T = unknown>(
  filePath: string,
  options?: { tsconfig?: string },
): Promise<T> {
  const fullPath = path.resolve(process.cwd(), filePath);
  const resolvedStats = await settlePromise(stat(fullPath));
  if (resolvedStats.status === 'rejected') {
    throw new Error(`File '${filePath}' does not exist`);
  }
  if (!resolvedStats.value.isFile()) {
    throw new Error(`Expected '${filePath}' to be a file`);
  }

  // paths like 'code-pushup.config.ts' must be converted to './code-pushup.config.ts'
  const modulePath = path.isAbsolute(filePath)
    ? filePath
    : path.format({ dir: '.', base: filePath });
  const alias = options?.tsconfig
    ? loadAliasFromTsconfigPaths(options.tsconfig)
    : undefined;

  const jiti = createJiti(process.cwd(), { alias });
  return jiti.import<T>(modulePath, { default: true });
}

export function loadTsconfig(tsconfig: string): ts.ParsedCommandLine {
  const { config, error } = ts.readConfigFile(tsconfig, ts.sys.readFile);
  if (error) {
    throw new Error(
      `Error reading TypeScript config file at ${tsconfig}:\n${error.messageText}`,
    );
  }

  return ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(tsconfig),
    {},
    tsconfig,
  );
}

function tsconfigPathsToAlias(
  tsconfigPath: string,
  compilerOptions: ts.CompilerOptions,
): Record<string, string> | undefined {
  if (!compilerOptions.paths) {
    return undefined;
  }

  // resolve relative paths to absolute just like TypeScript does it
  // https://www.typescriptlang.org/docs/handbook/modules/reference.html#paths
  const tsconfigDir = path.dirname(tsconfigPath);
  const baseDir = compilerOptions.baseUrl
    ? path.resolve(tsconfigDir, compilerOptions.baseUrl)
    : tsconfigDir;

  return Object.fromEntries(
    Object.entries(compilerOptions.paths)
      .map(([key, value]) => [key, value[0]] as const)
      .filter((pair): pair is [string, string] => pair[1] != null)
      .map(([key, value]) => [key, path.join(baseDir, value)]),
  );
}

function loadAliasFromTsconfigPaths(
  tsconfig: string,
): Record<string, string> | undefined {
  const config = loadTsconfig(tsconfig);
  return tsconfigPathsToAlias(tsconfig, config.options);
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
