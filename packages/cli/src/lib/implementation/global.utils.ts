import { toArray } from '@code-pushup/utils';

export function filterKebabCaseKeys<T extends Record<string, unknown>>(
  obj: T,
): T {
  return Object.entries(obj)
    .filter(([key]) => !key.includes('-'))
    .reduce(
      (acc, [key, value]) =>
        typeof value === 'string' ||
        (typeof value === 'object' && Array.isArray(obj[key]))
          ? { ...acc, [key]: value }
          : typeof value === 'object' && !Array.isArray(value) && value != null
          ? {
              ...acc,
              [key]: filterKebabCaseKeys(value as Record<string, unknown>),
            }
          : { ...acc, [key]: value },
      {},
    ) as T;
}

// log error and flush stdout so that Yargs doesn't suppress it
// related issue: https://github.com/yargs/yargs/issues/2118
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logErrorBeforeThrow<T extends (...args: any[]) => any>(
  fn: T,
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
      return await fn(...args);
    } catch (error) {
      console.error(error);
      await new Promise(resolve => process.stdout.write('', resolve));
      throw error;
    }
  }) as T;
}

export function coerceArray<T extends string>(param: T | T[] = []): T[] {
  return [...new Set(toArray(param).flatMap((f: T) => f.split(',') as T[]))];
}
