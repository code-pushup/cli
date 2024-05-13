import { platform } from 'node:os';
import {
  PrimitiveValue,
  Table,
  TableAlignment,
  TableHeading,
  TableRow,
} from '@code-pushup/models';

export function toArray<T>(val: T | T[]): T[] {
  return Array.isArray(val) ? val : [val];
}

export function objectToKeys<T extends object>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

export function objectToEntries<T extends object>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function objectFromEntries<K extends PropertyKey, V>(entries: [K, V][]) {
  return Object.fromEntries(entries) as Record<K, V>;
}

export function countOccurrences<T extends PropertyKey>(
  values: T[],
): Partial<Record<T, number>> {
  return values.reduce<Partial<Record<T, number>>>(
    (acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }),
    {},
  );
}

export function exists<T>(value: T): value is NonNullable<T> {
  return value != null;
}

export function distinct<T extends string | number | boolean>(array: T[]): T[] {
  return [...new Set(array)];
}

export function deepClone<T>(obj: T): T {
  return obj == null || typeof obj !== 'object' ? obj : structuredClone(obj);
}

export function factorOf<T>(items: T[], filterFn: (i: T) => boolean): number {
  const itemCount = items.length;
  // early exit for empty rows
  if (!itemCount) {
    return 1;
  }
  const filterCount = items.filter(filterFn).length;
  // if no rows result from the filter fn we forward return 1 as factor
  return filterCount === 0 ? 1 : (itemCount - filterCount) / itemCount;
}

type ArgumentValue = number | string | boolean | string[];
export type CliArgsObject<T extends object = Record<string, ArgumentValue>> =
  T extends never
    ? // eslint-disable-next-line @typescript-eslint/naming-convention
      Record<string, ArgumentValue | undefined> | { _: string }
    : T;

/**
 * Converts an object with different types of values into an array of command-line arguments.
 *
 * @example
 * const args = objectToProcessArgs({
 *   _: ['node', 'index.js'], // node index.js
 *   name: 'Juanita', // --name=Juanita
 *   formats: ['json', 'md'] // --format=json --format=md
 * });
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function objectToCliArgs<
  T extends object = Record<string, ArgumentValue>,
>(params?: CliArgsObject<T>): string[] {
  if (!params) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.entries(params).flatMap(([key, value]) => {
    // process/file/script
    if (key === '_') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Array.isArray(value) ? value : [`${value}`];
    }
    const prefix = key.length === 1 ? '-' : '--';
    // "-*" arguments (shorthands)
    if (Array.isArray(value)) {
      return value.map(v => `${prefix}${key}="${v}"`);
    }
    // "--*" arguments ==========

    if (Array.isArray(value)) {
      return value.map(v => `${prefix}${key}="${v}"`);
    }

    if (typeof value === 'string') {
      return [`${prefix}${key}="${value}"`];
    }

    if (typeof value === 'number') {
      return [`${prefix}${key}=${value}`];
    }

    if (typeof value === 'boolean') {
      return [`${prefix}${value ? '' : 'no-'}${key}`];
    }

    // @TODO add support for nested objects `persist.filename`

    throw new Error(`Unsupported type ${typeof value} for key ${key}`);
  });
}

export function toUnixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function toUnixNewlines(text: string): string {
  return platform() === 'win32' ? text.replace(/\r\n/g, '\n') : text;
}

export function fromJsonLines<T = unknown>(jsonLines: string) {
  const unifiedNewLines = toUnixNewlines(jsonLines).trim();
  return JSON.parse(`[${unifiedNewLines.split('\n').join(',')}]`) as T;
}

export function toJsonLines<T>(json: T[]) {
  return json.map(item => JSON.stringify(item)).join('\n');
}

export function capitalize<T extends string>(text: T): Capitalize<T> {
  return `${text.charAt(0).toLocaleUpperCase()}${text.slice(
    1,
  )}` as Capitalize<T>;
}

export function apostrophize(text: string, upperCase?: boolean) {
  const lastCharMatch = text.match(/(\w)\W*$/);
  const lastChar = lastCharMatch?.[1] ?? '';

  return `${text}'${
    lastChar.toLocaleLowerCase() === 's' ? '' : upperCase ? 'S' : 's'
  }`;
}

export function toNumberPrecision(
  value: number,
  decimalPlaces: number,
): number {
  return Number(
    `${Math.round(
      Number.parseFloat(`${value}e${decimalPlaces}`),
    )}e-${decimalPlaces}`,
  );
}

/* eslint-disable no-magic-numbers */
export function toOrdinal(value: number): string {
  if (value % 10 === 1 && value % 100 !== 11) {
    return `${value}st`;
  }

  if (value % 10 === 2 && value % 100 !== 12) {
    return `${value}nd`;
  }

  if (value % 10 === 3 && value % 100 !== 13) {
    return `${value}rd`;
  }

  return `${value}th`;
}
/* eslint-enable no-magic-numbers */

export function tableToStringArray({
  headings,
  rows,
}: Table): (string | number)[][] {
  const firstRow = rows[0];
  // Determine effective headings based on the input rows and optional headings parameter
  const generateHeadings = (): string[] => {
    if (headings && headings.length > 0) {
      return headings.map(({ label, key }) => label ?? capitalize(key ?? ''));
    } else {
      if (typeof firstRow === 'object' && !Array.isArray(firstRow)) {
        return Object.keys(firstRow);
      }
      // Default to indexing if the rows are primitive types or single-element arrays
      return firstRow?.map((_, idx) => idx.toString()) ?? [];
    }
  };

  // Combine headings and rows to create the full table array
  return [generateHeadings(), ...rowToStringArray(rows, headings)];
}

export function rowToStringArray(
  unparsedRows: TableRow[],
  givenHeadings: TableHeading[] = [],
): string[][] {
  return unparsedRows.map(row => {
    // For array rows, return the row itself (assuming one element per array for simplicity)
    if (Array.isArray(row)) {
      return row.map(String);
    }

    const objectRow = row;
    // For object rows, map heading to the value in the object
    return givenHeadings.length > 0
      ? givenHeadings.map(({ key }): string => {
          const k = key ?? '';
          return String(objectRow[k] ?? '');
        })
      : Object.values(objectRow).map(String);
  });
}

export function getColumnAlignments(
  rows: TableRow[],
  headings?: TableHeading[],
): TableAlignment[] {
  // this is caught by the table schema in @code-pushup/models
  if (rows.at(0) == null) {
    throw new Error('first row cant be undefined.');
  }

  if (Array.isArray(rows.at(0))) {
    const firstPrimitiveRow = rows.at(0) as PrimitiveValue[];
    return Array.from({ length: firstPrimitiveRow.length }).map((_, idx) =>
      getColumnAlignmentForIndex(idx, headings),
    );
  }

  const firstObject = rows.at(0) as Record<string, unknown>;
  return Object.keys(firstObject).map(key =>
    getColumnAlignmentForKey(key, headings),
  );
}

export function getColumnAlignmentForKey(
  targetKey: string,
  headings: TableHeading[] = [],
): TableAlignment {
  return (
    headings.find(({ key }) => targetKey === key)?.align ?? ('center' as const)
  );
}

export function getColumnAlignmentForIndex(
  idx: number,
  headings: TableHeading[] = [],
): TableAlignment {
  return headings.at(idx)?.align ?? ('center' as const);
}
