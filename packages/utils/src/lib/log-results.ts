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

    logPluginExecution(
      succeededResults,
      `${messagePrefix} successfully: `,
      succeededCallback,
    );
  }

  if (failedCallback) {
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    logPluginExecution(
      failedResults,
      `${messagePrefix} failed: `,
      failedCallback,
    );
  }
}

export function logPluginExecution<T>(
  results: (PromiseFulfilledResult<T> | PromiseRejectedResult)[],
  logMessage: string,
  callback:
    | ((result: PromiseFulfilledResult<T>) => void)
    | ((result: PromiseRejectedResult) => void),
): void {
  if (results.length) {
    console.log(logMessage);
    results.forEach(
      callback as (
        result: PromiseFulfilledResult<T> | PromiseRejectedResult,
      ) => void,
    );
  }
}
