import {
  AuditOutput,
  CategoryConfig,
  CategoryConfigRefType, Issue,
} from '@code-pushup/models';
import {readFile} from "@nx/plugin/testing";

export const reportHeadlineText = 'Code Pushup Report';
export const reportOverviewTableHeaders = ['Category', 'Score', 'Audits'];

/** Weighted reference to audit or group
 * @TODO reuse model types
 * */
export type CategoryConfigRef = {
  /** Plugin slug */
  plugin: string;
  /** Audit or group slug */
  slug: string;
  /** Discrimant between audit or group */
  type: CategoryConfigRefType.Audit | 'Group';
  /** Multiplier used to calculate category score as weighted average */
  weight: number;
};

export class UserInputError extends Error {
  constructor(message: string) {
    super('BAD_USER_INPUT ' + message);
  }
}

export function refToScore(
  plugins: PluginOutput[],
  categoryConfigs: CategoryConfig[],
) {
  categoryConfigs;
  const groups = plugins.map(({ audits }) => audits).flatMap(s => s);
  const audits = plugins.map(({ audits }) => audits).flatMap(s => s);
  return (ref: CategoryConfigRef): number => {
    let scorable: AuditOutput | undefined;
    switch (ref.type) {
      case CategoryConfigRefType.Audit:
        scorable = audits?.find(
          a => a.slug === ref.slug && a.slug === ref.plugin,
        );
        if (!scorable) {
          throw new UserInputError(
            `Category has invalid ref - audit with slug ${ref.slug} not found in ${ref.plugin} plugin`,
          );
        }
        return scorable.score;

      case CategoryConfigRefType.Group:
        scorable = groups.find(
          g => g.slug === ref.slug && g.slug === ref.plugin,
        );
        if (!scorable) {
          throw new UserInputError(
            `Category has invalid ref - group with slug ${ref.slug} not found in ${ref.plugin} plugin`,
          );
        }
        return scorable.score;
      default:
        throw new Error('should not happen');
    }
  };
}

export function calculateScore<T extends { weight: number }>(
  refs: T[],
  scoreFn: (ref: T) => number,
): number {
  const numerator = refs.reduce(
    (sum, ref) => sum + scoreFn(ref) * ref.weight,
    0,
  );
  const denominator = refs.reduce((sum, ref) => sum + ref.weight, 0);
  return numerator / denominator;
}

export function countWeightedRefs(refs: CategoryConfig['refs']) {
  return refs
    .filter(({ weight }) => weight > 0)
    .reduce((sum, { weight }) => sum + weight, 0);
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

export function distinct<T extends string | number | boolean>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function toArray<T>(val: T | T[]): T[] {
  return Array.isArray(val) ? val : [val];
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+|\//g, '-')
    .replace(/[^a-z0-9-]/g, '');
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

export function compareIssueSeverity(
  severity1: Issue['severity'],
  severity2: Issue['severity'],
): number {
  const levels: Record<Issue['severity'], number> = {
    info: 0,
    warning: 1,
    error: 2,
  };
  return levels[severity1] - levels[severity2];
}

export async function readTextFile(path: string): Promise<string> {
  const buffer = await readFile(path);
  return buffer.toString();
}

export async function readJsonFile(path: string): Promise<unknown> {
  const text = await readTextFile(path);
  return JSON.parse(text);
}

export function formatCount(count: number, name: string) {
  const text = count === 1 ? name : pluralize(name);
  return `${count} ${text}`;
}

export function pluralize(text: string): string {
  if (text.endsWith('y')) {
    return text.slice(0, -1) + 'ies';
  }
  if (text.endsWith('s')) {
    return `${text}es`;
  }
  return `${text}s`;
}
