import { readFile, readdir } from 'node:fs/promises';
import { join } from 'path';
import {
  CategoryRef,
  Format,
  IssueSeverity,
  PersistConfig,
  REPORT_NAME_PATTERN,
} from '@code-pushup/models';
import { ensureDirectoryExists, pluralize } from './utils';

export const FOOTER_PREFIX = 'Made with ❤️ by';
export const CODE_PUSHUP_DOMAIN = 'code-pushup.dev';

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+|\//g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calcDuration(start: number, stop?: number): number {
  stop = stop !== undefined ? stop : performance.now();
  return Math.floor(stop - start);
}

export function formatCount(count: number, name: string) {
  const text = count === 1 ? name : pluralize(name);
  return `${count} ${text}`;
}

export function countWeightedRefs(refs: CategoryRef[]) {
  return refs
    .filter(({ weight }) => weight > 0)
    .reduce((sum, { weight }) => sum + weight, 0);
}

export function compareIssueSeverity(
  severity1: IssueSeverity,
  severity2: IssueSeverity,
): number {
  const levels: Record<IssueSeverity, number> = {
    info: 0,
    warning: 1,
    error: 2,
  };
  return levels[severity1] - levels[severity2];
}

// @TODO replace with real scoring logic
export function sumRefs(refs: CategoryRef[]) {
  return refs.reduce((sum, { weight }) => sum + weight, 0);
}

export async function loadReports(options: PersistConfig) {
  const { outputDir, filename, format } = options;
  await ensureDirectoryExists(outputDir);

  const dirResult = await readdir(outputDir);

  const result = await Promise.allSettled(
    dirResult
      // filter by file extension
      .filter(file =>
        format ? format.find(ext => file.endsWith(`.${ext}`)) : true,
      )
      // filter by file name
      .filter(file =>
        filename
          ? file.includes(filename)
          : new RegExp(REPORT_NAME_PATTERN).test(file),
      )
      .map(file => getFileResult(file, outputDir)),
  );
  return result;
}

export async function loadReport(
  options: Required<Pick<PersistConfig, 'outputDir' | 'filename'>> & {
    format: Format;
  },
) {
  const { outputDir, filename, format } = options;
  await ensureDirectoryExists(outputDir);
  const filePath = join(outputDir, `${filename}.${format}`);
  const content = await readFile(filePath, 'utf8');
  return content;
}

async function getFileResult(
  file: string,
  outputDir: string,
): Promise<[string, string | null]> {
  const filePath = join(outputDir, file);
  const content = await readFile(filePath, 'utf8');
  return [file, content || null];
}
