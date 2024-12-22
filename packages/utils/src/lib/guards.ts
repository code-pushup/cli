import type { ExcludeNullableProps } from './types.js';

export function isPromiseFulfilledResult<T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

export function isPromiseRejectedResult(
  result: PromiseSettledResult<unknown>,
): result is PromiseRejectedResult {
  return result.status === 'rejected';
}

export function hasNoNullableProps<T extends object>(
  obj: T,
): obj is ExcludeNullableProps<T> {
  return Object.values(obj).every(value => value != null);
}
