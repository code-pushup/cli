import type {
  AuditOutputs,
  RunnerArgs,
  RunnerFunction,
} from '@code-pushup/models';
import {
  addIndex,
  logger,
  shouldExpandForUrls,
  stringifyError,
} from '@code-pushup/utils';
import { closeBrowser, runAxeForUrl } from './run-axe.js';

export function createRunnerFunction(
  urls: string[],
  ruleIds: string[],
): RunnerFunction {
  return async (_runnerArgs?: RunnerArgs): Promise<AuditOutputs> => {
    const isSingleUrl = !shouldExpandForUrls(urls.length);

    logger.info(
      `Running Axe accessibility checks for ${urls.length} URL(s)...`,
    );

    try {
      const allResults = await urls.reduce(async (prev, url, index) => {
        const acc = await prev;

        logger.debug(`Testing URL ${index + 1}/${urls.length}: ${url}`);

        try {
          const auditOutputs = await runAxeForUrl(url, ruleIds);

          const processedOutputs = isSingleUrl
            ? auditOutputs
            : auditOutputs.map(audit => ({
                ...audit,
                slug: addIndex(audit.slug, index),
              }));

          return [...acc, ...processedOutputs];
        } catch (error) {
          logger.warn(stringifyError(error));
          return acc;
        }
      }, Promise.resolve<AuditOutputs>([]));

      if (allResults.length === 0) {
        throw new Error(
          isSingleUrl
            ? 'Axe did not produce any results.'
            : 'Axe failed to produce results for all URLs.',
        );
      }

      logger.info(
        `Completed Axe accessibility checks with ${allResults.length} audit(s)`,
      );

      return allResults;
    } finally {
      await closeBrowser();
    }
  };
}
