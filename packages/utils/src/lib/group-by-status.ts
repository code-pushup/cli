export function groupByStatus<T>(results: PromiseSettledResult<T>[]): {
  fulfilled: PromiseFulfilledResult<T>[];
  rejected: PromiseRejectedResult[];
} {
  return results.reduce<{
    fulfilled: PromiseFulfilledResult<T>[];
    rejected: PromiseRejectedResult[];
  }>(
    (acc, result) =>
      result.status === 'fulfilled'
        ? { ...acc, fulfilled: [...acc.fulfilled, result] }
        : { ...acc, rejected: [...acc.rejected, result] },
    { fulfilled: [], rejected: [] },
  );
}
