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
  // early exit for empty items
  if (!itemCount) {
    return 1;
  }
  const filterCount = items.filter(filterFn).length;
  // if no items result from the filter fn we forward return 1 as factor
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

export function toUnixPath(
  path: string,
  options?: { toRelative?: boolean },
): string {
  const unixPath = path.replace(/\\/g, '/');

  if (options?.toRelative) {
    return unixPath.replace(`${process.cwd().replace(/\\/g, '/')}/`, '');
  }

  return unixPath;
}
