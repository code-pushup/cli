import { isPromiseFulfilledResult, isPromiseRejectedResult } from './guards.js';
import { ui } from './logging.js';

export function logMultipleResults<T>(
  results: PromiseSettledResult<T>[],
  messagePrefix: string,
  succeededTransform?: (result: PromiseFulfilledResult<T>) => string,
  failedTransform?: (result: PromiseRejectedResult) => string,
) {
  if (succeededTransform) {
    const succeededResults = results.filter(isPromiseFulfilledResult);

    logPromiseResults(
      succeededResults,
      `${messagePrefix} successfully: `,
      succeededTransform,
    );
  }

  if (failedTransform) {
    const failedResults = results.filter(isPromiseRejectedResult);

    logPromiseResults(
      failedResults,
      `${messagePrefix} failed: `,
      failedTransform,
    );
  }
}

export function logPromiseResults<
  T extends PromiseFulfilledResult<unknown> | PromiseRejectedResult,
>(results: T[], logMessage: string, getMsg: (result: T) => string): void {
  if (results.length > 0) {
    const log =
      results[0]?.status === 'fulfilled'
        ? (m: string) => {
            ui().logger.success(m);
          }
        : (m: string) => {
            ui().logger.warning(m);
          };

    log(logMessage);
    results.forEach(result => {
      log(getMsg(result));
    });
  }
}
