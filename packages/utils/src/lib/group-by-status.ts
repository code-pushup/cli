export function groupByStatus<T>(results: PromiseSettledResult<T>[]): {
  fulfilled: PromiseFulfilledResult<T>[];
  rejected: PromiseRejectedResult[];
} {
  return results.reduce<{
    fulfilled: PromiseFulfilledResult<T>[];
    rejected: PromiseRejectedResult[];
  }>(
    (accumulator, currentValue) => {
      if (currentValue.status === 'fulfilled' && 'value' in currentValue) {
        accumulator.fulfilled.push(currentValue);
      } else if (
        currentValue.status === 'rejected' &&
        'reason' in currentValue
      ) {
        accumulator.rejected.push(currentValue);
      }
      return accumulator;
    },
    { fulfilled: [], rejected: [] },
  );
}
