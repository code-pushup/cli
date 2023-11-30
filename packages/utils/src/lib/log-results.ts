import { isPromiseFulfilledResult, isPromiseRejectedResult } from './guards';

export function logMultipleResults<T>(
  results: PromiseSettledResult<T>[],
  messagePrefix: string,
  succeededCallback?: (result: PromiseFulfilledResult<T>) => void,
  failedCallback?: (result: PromiseRejectedResult) => void,
) {
  if (succeededCallback) {
    const succeededResults = results.filter(isPromiseFulfilledResult);

    logPromiseResults(
      succeededResults,
      `${messagePrefix} successfully: `,
      succeededCallback,
    );
  }

  if (failedCallback) {
    const failedResults = results.filter(isPromiseRejectedResult);

    logPromiseResults(
      failedResults,
      `${messagePrefix} failed: `,
      failedCallback,
    );
  }
}

export function logPromiseResults<
  T extends PromiseFulfilledResult<unknown> | PromiseRejectedResult,
>(results: T[], logMessage: string, callback: (result: T) => void): void {
  if (results.length) {
    console.log(logMessage);
    results.forEach(callback);
  }
}
