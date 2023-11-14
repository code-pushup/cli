export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+|\//g, '-')
    .replace(/[^a-z0-9-]/g, '');
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

export function deepClone<T>(obj: T): T {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  const cloned: T = Array.isArray(obj) ? ([] as T) : ({} as T);
  // eslint-disable-next-line functional/no-loop-statements
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key as keyof T] = deepClone(obj[key]);
    }
  }
  return cloned;
}
