import chalk from 'chalk';
import { mkdir, readFile } from 'fs/promises';
import { formatBytes } from './report';

// @TODO move logic out of this file as much as possible. use report.ts or scoring.ts instead.
export const reportHeadlineText = 'Code PushUp Report';
export const reportOverviewTableHeaders = [
  '🏷 Category',
  '⭐ Score',
  '🛡 Audits',
];
export const reportMetaTableHeaders: string[] = [
  'Commit',
  'Version',
  'Duration',
  'Plugins',
  'Categories',
  'Audits',
];

export const pluginMetaTableHeaders: string[] = [
  'Plugin',
  'Audits',
  'Version',
  'Duration',
];

// details headers

export const detailsTableHeaders: string[] = [
  'Severity',
  'Message',
  'Source file',
  'Line(s)',
];

// === Transform

export function pluralize(text: string): string {
  if (text.endsWith('y')) {
    return text.slice(0, -1) + 'ies';
  }
  if (text.endsWith('s')) {
    return `${text}es`;
  }
  return `${text}s`;
}

export function toArray<T>(val: T | T[]): T[] {
  return Array.isArray(val) ? val : [val];
}

export function objectToKeys<T extends object>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

export function objectToEntries<T extends object>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function countOccurrences<T extends PropertyKey>(
  values: T[],
): Partial<Record<T, number>> {
  return values.reduce<Partial<Record<T, number>>>(
    (acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }),
    {},
  );
}

export function distinct<T extends string | number | boolean>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// @TODO move to report.ts
export function formatReportScore(score: number): string {
  return Math.round(score * 100).toString();
}

// === Markdown @TODO move to report-to-md.ts

export function getRoundScoreMarker(score: number): string {
  if (score >= 0.9) {
    return '🟢';
  }
  if (score >= 0.5) {
    return '🟡';
  }
  return '🔴';
}

export function getSquaredScoreMarker(score: number): string {
  if (score >= 0.9) {
    return '🟩';
  }
  if (score >= 0.5) {
    return '🟨';
  }
  return '🟥';
}

export function getSeverityIcon(
  severity: 'info' | 'warning' | 'error',
): string {
  if (severity === 'error') {
    return '🚨';
  }
  if (severity === 'warning') {
    return '⚠️';
  }
  return 'ℹ️';
}

// === Filesystem @TODO move to fs-utils.ts

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

export async function readJsonFile(path: string): Promise<unknown> {
  const text = await readTextFile(path);
  return JSON.parse(text);
}

export type FileResult = readonly [string] | readonly [string, number];
export type MultipleFileResults = PromiseSettledResult<FileResult>[];

export function logMultipleFileResults(
  persistResult: MultipleFileResults,
  messagePrefix: string,
) {
  const succeededPersistedResults = persistResult.filter(
    (result): result is PromiseFulfilledResult<[string, number]> =>
      result.status === 'fulfilled',
  );

  if (succeededPersistedResults.length) {
    console.log(`${messagePrefix} successfully: `);
    succeededPersistedResults.forEach(res => {
      const [fileName, size] = res.value;
      console.log(
        `- ${chalk.bold(fileName)}` +
          (size ? ` (${chalk.gray(formatBytes(size))})` : ''),
      );
    });
  }

  const failedPersistedResults = persistResult.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failedPersistedResults.length) {
    console.log(`${messagePrefix} failed: `);
    failedPersistedResults.forEach(result => {
      console.log(`- ${chalk.bold(result.reason)}`);
    });
  }
}
