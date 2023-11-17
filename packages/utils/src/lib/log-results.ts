type PromiseFulfilledResult<T> = {
  status: 'fulfilled';
  value: T;
};

export function logMultipleResults<T>(
  results: PromiseSettledResult<T>[],
  messagePrefix: string,
  succeededCallback?: (result: PromiseFulfilledResult<T>) => void,
  failedCallback?: (result: PromiseRejectedResult) => void,
) {
  if (succeededCallback) {
    const succeededResults = results.filter(
      (result): result is PromiseFulfilledResult<T> =>
        result.status === 'fulfilled',
    );

    if (succeededResults.length) {
      console.log(`${messagePrefix} successfully: `);
      succeededResults.forEach(succeededCallback);
    }
  }

  if (failedCallback) {
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (failedResults.length) {
      console.log(`${messagePrefix} failed: `);
      failedResults.forEach(failedCallback);
    }
  }
}
