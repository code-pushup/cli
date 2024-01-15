export function groupByStatus<T>(results: PromiseSettledResult<T>[]): {
  fulfilled: PromiseFulfilledResult<T>[];
  rejected: PromiseRejectedResult[];
} {
  return results.reduce<{
    fulfilled: PromiseFulfilledResult<T>[];
    rejected: PromiseRejectedResult[];
  }>(
    (acc, result) => {
      if (result.status === 'fulfilled') {
        return { ...acc, fulfilled: [...acc.fulfilled, result] };
      }
      if (result.status === 'rejected') {
        return { ...acc, rejected: [...acc.rejected, result] };
      }
      return acc;
    },
    { fulfilled: [], rejected: [] },
  );
}
