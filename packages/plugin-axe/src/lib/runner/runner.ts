import type { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import {
  addIndex,
  asyncSequential,
  formatAsciiTable,
  logger,
  pluralizeToken,
  shouldExpandForUrls,
  stringifyError,
} from '@code-pushup/utils';
import { AxeRunner, type AxeUrlArgs, type AxeUrlResult } from './run-axe.js';
import { loadSetupScript } from './setup.js';

/** Creates a runner function that executes Axe accessibility audits for given URLs. */
export function createRunnerFunction(
  urls: string[],
  ruleIds: string[],
  timeout: number,
  setupScript?: string,
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const runner = new AxeRunner();
    const urlsCount = urls.length;

    logger.info(
      `Running Axe accessibility checks for ${pluralizeToken('URL', urlsCount)} ...`,
    );

    try {
      if (setupScript) {
        const setupFn = await loadSetupScript(setupScript);
        await runner.captureAuthState(setupFn, timeout);
      }

      const results = await asyncSequential(
        urls,
        async (url, urlIndex): Promise<AxeUrlResult | null> =>
          runForUrl(runner, { urlsCount, ruleIds, timeout, url, urlIndex }),
      );

      const collectedResults = results.filter(res => res != null);
      const auditOutputs = collectedResults.flatMap(res => res.auditOutputs);
      if (collectedResults.length === 0) {
        throw new Error(
          shouldExpandForUrls(urlsCount)
            ? 'Axe failed to produce results for all URLs.'
            : 'Axe did not produce any results.',
        );
      }

      logResultsForAllUrls(collectedResults);

      return auditOutputs;
    } finally {
      await runner.close();
    }
  };
}

async function runForUrl(
  runner: AxeRunner,
  args: AxeUrlArgs,
): Promise<AxeUrlResult | null> {
  const { url, urlsCount, urlIndex } = args;
  try {
    const result = await runner.analyzeUrl(args);

    if (shouldExpandForUrls(urlsCount)) {
      return {
        ...result,
        auditOutputs: result.auditOutputs.map(audit => ({
          ...audit,
          slug: addIndex(audit.slug, urlIndex),
        })),
      };
    }

    return result;
  } catch (error) {
    logger.warn(`Axe execution failed for ${url}: ${stringifyError(error)}`);
    return null;
  }
}

function logResultsForAllUrls(results: AxeUrlResult[]): void {
  logger.info(
    formatAsciiTable({
      columns: [
        { key: 'url', label: 'URL', align: 'left' },
        { key: 'passes', label: 'Passes', align: 'right' },
        { key: 'violations', label: 'Violations', align: 'right' },
        { key: 'incomplete', label: 'Incomplete', align: 'right' },
        { key: 'inapplicable', label: 'Inapplicable', align: 'right' },
      ],
      rows: results.map(res => ({
        url: res.url,
        passes: res.axeResults.passes.length,
        violations: res.axeResults.violations.length,
        incomplete: res.axeResults.incomplete.length,
        inapplicable: res.axeResults.inapplicable.length,
      })),
    }),
  );
}
