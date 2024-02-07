import { isPromiseFulfilledResult, isPromiseRejectedResult } from './guards';
import {ui} from "./logging";

export function logMultipleResults<T>(
  results: PromiseSettledResult<T>[],
  messagePrefix: string,
  succeededCallback?: (result: PromiseFulfilledResult<T>) => string,
  failedCallback?: (result: PromiseRejectedResult) => string,
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
>(results: T[], logMessage: string, getMsg: (result: T) => string): void {
  if (results.length > 0) {
    const log = results[0]?.status === 'fulfilled' ? (m: string) => {
      ui().logger.info(m)
    } : (m: string) => {
      ui().logger.warning(m);
    }

    log(logMessage);
    results.forEach((result) => {
      log(getMsg(result))
    });
  }
}
