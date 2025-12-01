import type { Config, RunnerResult } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import path from 'node:path';
import type { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import {
  addIndex,
  ensureDirectoryExists,
  formatAsciiLink,
  logger,
  shouldExpandForUrls,
  stringifyError,
} from '@code-pushup/utils';
import type { LighthouseOptions } from '../types.js';
import { DEFAULT_CLI_FLAGS } from './constants.js';
import type { LighthouseCliFlags } from './types.js';
import {
  enrichFlags,
  getConfig,
  normalizeAuditOutputs,
  toAuditOutputs,
  withLocalTmpDir,
} from './utils.js';

export function createRunnerFunction(
  urls: string[],
  flags: LighthouseCliFlags = DEFAULT_CLI_FLAGS,
): RunnerFunction {
  return withLocalTmpDir(async (): Promise<AuditOutputs> => {
    const config = await getConfig(flags);
    const normalizationFlags = enrichFlags(flags);
    const isSingleUrl = !shouldExpandForUrls(urls.length);

    const allResults = await urls.reduce(async (prev, url, index) => {
      const acc = await prev;
      try {
        const enrichedFlags = isSingleUrl
          ? normalizationFlags
          : enrichFlags(flags, index + 1);

        const auditOutputs = await runLighthouseForUrl(
          url,
          enrichedFlags,
          config,
        );

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
          ? 'Lighthouse did not produce a result.'
          : 'Lighthouse failed to produce results for all URLs.',
      );
    }
    return normalizeAuditOutputs(allResults, normalizationFlags);
  });
}

async function runLighthouseForUrl(
  url: string,
  flags: LighthouseOptions,
  config: Config | undefined,
): Promise<AuditOutputs> {
  if (flags.outputPath) {
    await ensureDirectoryExists(path.dirname(flags.outputPath));
  }

  const runnerResult: unknown = await runLighthouse(url, flags, config);

  if (runnerResult == null) {
    throw new Error(
      `Lighthouse did not produce a result for URL: ${formatAsciiLink(url)}`,
    );
  }

  const { lhr } = runnerResult as RunnerResult;

  return toAuditOutputs(Object.values(lhr.audits), flags);
}
