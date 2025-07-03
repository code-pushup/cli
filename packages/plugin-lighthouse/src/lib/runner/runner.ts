import type { RunnerResult } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import path from 'node:path';
import type { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import { ensureDirectoryExists, ui } from '@code-pushup/utils';
import { orderSlug, shouldExpandForUrls } from '../processing.js';
import { DEFAULT_CLI_FLAGS } from './constants.js';
import type { LighthouseCliFlags } from './types.js';
import {
  enrichFlags,
  getConfig,
  normalizeAuditOutputs,
  toAuditOutputs,
} from './utils.js';

export function createRunnerFunction(
  urls: string[],
  flags: LighthouseCliFlags = DEFAULT_CLI_FLAGS,
): RunnerFunction {
  return !shouldExpandForUrls(urls.length) && urls[0]
    ? createSingleUrlRunner(urls[0], flags)
    : createMultipleUrlRunner(urls, flags);
}

function createSingleUrlRunner(
  url: string,
  flags: LighthouseCliFlags,
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const config = await getConfig(flags);

    if (flags.outputPath) {
      await ensureDirectoryExists(path.dirname(flags.outputPath));
    }

    const enrichedFlags = enrichFlags(flags);

    const runnerResult: unknown = await runLighthouse(
      url,
      enrichedFlags,
      config,
    );

    if (runnerResult == null) {
      throw new Error('Lighthouse did not produce a result.');
    }

    const { lhr } = runnerResult as RunnerResult;
    const auditOutputs = toAuditOutputs(Object.values(lhr.audits), flags);

    return normalizeAuditOutputs(auditOutputs, enrichedFlags);
  };
}

function createMultipleUrlRunner(
  urls: string[],
  flags: LighthouseCliFlags,
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const config = await getConfig(flags);

    const allResults = await urls.reduce(async (prev, url, index) => {
      const acc = await prev;
      try {
        const enrichedFlags = enrichFlags(flags, index + 1);

        if (enrichedFlags.outputPath) {
          await ensureDirectoryExists(path.dirname(enrichedFlags.outputPath));
        }

        const runnerResult: unknown = await runLighthouse(
          url,
          enrichedFlags,
          config,
        );

        if (runnerResult == null) {
          throw new Error(
            `Lighthouse did not produce a result for URL: ${url}`,
          );
        }

        const { lhr } = runnerResult as RunnerResult;
        const auditOutputs = toAuditOutputs(Object.values(lhr.audits), flags);

        const processedOutputs = auditOutputs.map(audit => ({
          ...audit,
          slug: orderSlug(audit.slug, index),
        }));

        return [...acc, ...processedOutputs];
      } catch (error) {
        ui().logger.warning((error as Error).message);
        return acc;
      }
    }, Promise.resolve<AuditOutputs>([]));

    if (allResults.length === 0) {
      throw new Error('Lighthouse failed to produce results for all URLs.');
    }

    return normalizeAuditOutputs(allResults, flags);
  };
}
