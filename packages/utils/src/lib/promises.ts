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

export async function asyncSequential<TInput, TOutput>(
  items: TInput[],
  work: (item: TInput) => Promise<TOutput>,
): Promise<TOutput[]> {
  // for-loop used instead of reduce for performance
  const results: TOutput[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for (const item of items) {
    const result = await work(item);
    // eslint-disable-next-line functional/immutable-data
    results.push(result);
  }
  return results;
}
