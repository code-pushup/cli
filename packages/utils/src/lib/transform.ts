import { platform } from 'node:os';

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
    ? Record<string, ArgumentValue | undefined> | { _: string }
    : T;

/**
 * Converts an object with different types of values into an array of command-line arguments.
 *
 * @example
 * const args = objectToCliArgs({
 *   _: ['node', 'index.js'], // node index.js
 *   name: 'Juanita', // --name=Juanita
 *   formats: ['json', 'md'] // --format=json --format=md
 * });
 */
export function objectToCliArgs<
  T extends object = Record<string, ArgumentValue>,
>(params?: CliArgsObject<T>): string[] {
  if (!params) {
    return [];
  }

  return Object.entries(params).flatMap(([key, value]) => {
    // process/file/script
    if (key === '_') {
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

    if (typeof value === 'object') {
      return Object.entries(value as Record<string, ArgumentValue>).flatMap(
        // transform nested objects to the dot notation `key.subkey`
        ([k, v]) => objectToCliArgs({ [`${key}.${k}`]: v }),
      );
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

    if (value === null || value === undefined) {
      return [];
    }

    throw new Error(`Unsupported type ${typeof value} for key ${key}`);
  });
}

export function toUnixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function toUnixNewlines(text: string): string {
  return platform() === 'win32' ? text.replace(/\r\n/g, '\n') : text;
}

export function fromJsonLines<T extends unknown[]>(jsonLines: string) {
  const unifiedNewLines = toUnixNewlines(jsonLines).trim();
  const invalid = Symbol('invalid json');
  return unifiedNewLines
    .split('\n')
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return invalid;
      }
    })
    .filter(line => line !== invalid) as T;
}

export function toJsonLines<T>(json: T[]) {
  return json.map(item => JSON.stringify(item)).join('\n');
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

export function toOrdinal(value: number): string {
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  if (value % 10 === 1 && value % 100 !== 11) {
    return `${value}st`;
  }

  if (value % 10 === 2 && value % 100 !== 12) {
    return `${value}nd`;
  }

  if (value % 10 === 3 && value % 100 !== 13) {
    return `${value}rd`;
  }
  /* eslint-enable @typescript-eslint/no-magic-numbers */

  return `${value}th`;
}

export function removeUndefinedAndEmptyProps<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  ) as T;
}
