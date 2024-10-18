import yargs from 'yargs';
import { toArray, ui } from '@code-pushup/utils';
import { OptionValidationError } from './validate-filter-options.utils';

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

// Log error and flush stdout to ensure all logs are printed
// before Yargs exits or rethrows the error.
// This prevents log suppression, especially in async execution.
// Related issue: https://github.com/yargs/yargs/issues/2118
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
      if (error instanceof OptionValidationError) {
        ui().logger.error(error.message);
        await new Promise(resolve => process.stdout.write('', resolve));
        yargs().exit(1, error);
      } else {
        console.error(error);
        await new Promise(resolve => process.stdout.write('', resolve));
        throw error;
      }
    }
  }) as T;
}

export function coerceArray(param: string): string[] {
  return [...new Set(toArray(param).flatMap(f => f.split(',')))];
}
