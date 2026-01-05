import ansis from 'ansis';
import type { Config, Result, RunnerResult } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import path from 'node:path';
import type {
  AuditOutputs,
  RunnerFunction,
  TableColumnObject,
} from '@code-pushup/models';
import {
  addIndex,
  asyncSequential,
  ensureDirectoryExists,
  formatAsciiTable,
  formatReportScore,
  logger,
  shouldExpandForUrls,
  stringifyError,
} from '@code-pushup/utils';
import type { LighthouseOptions } from '../types.js';
import { DEFAULT_CLI_FLAGS } from './constants.js';
import type { LighthouseCliFlags } from './types.js';
import {
  enrichFlags,
  filterAuditOutputs,
  getConfig,
  toAuditOutputs,
  withLocalTmpDir,
} from './utils.js';

export function createRunnerFunction(
  urls: string[],
  flags: LighthouseCliFlags = DEFAULT_CLI_FLAGS,
): RunnerFunction {
  return (): Promise<AuditOutputs> =>
    profiler.measureAsync(
      'plugin-lighthouse:runner',
      withLocalTmpDir(async (): Promise<AuditOutputs> => {
        const config = await getConfig(flags);
        const normalizationFlags = enrichFlags(flags);
        const urlsCount = urls.length;
        const isSingleUrl = !shouldExpandForUrls(urlsCount);

        const allResults = await asyncSequential(urls, (url, urlIndex) => {
          const enrichedFlags = isSingleUrl
            ? normalizationFlags
            : enrichFlags(flags, urlIndex + 1);
          const step = { urlIndex, urlsCount };
          return runLighthouseForUrl(url, enrichedFlags, config, step);
        });

        const collectedResults = allResults.filter(res => res != null);
        if (collectedResults.length === 0) {
          throw new Error(
            isSingleUrl
              ? 'Lighthouse did not produce a result.'
              : 'Lighthouse failed to produce results for all URLs.',
          );
        }

        logResultsForAllUrls(collectedResults);

        const auditOutputs: AuditOutputs = collectedResults.flatMap(
          res => res.auditOutputs,
        );
        return filterAuditOutputs(auditOutputs, normalizationFlags);
      }),
      {
        ...profiler.measureConfig.tracks.pluginLighthouse,
        success: (result: AuditOutputs) => ({
          properties: [
            ['URLs', String(urls.length)],
            ['Audits', String(result.length)],
            ['Successful Runs', String(result.length > 0 ? urls.length : 0)],
          ],
          tooltipText: `Lighthouse analysis completed for ${urls.length} URLs with ${result.length} audits`,
        }),
      },
    );
}

type ResultForUrl = {
  url: string;
  lhr: Result;
  auditOutputs: AuditOutputs;
};

async function runLighthouseForUrl(
  url: string,
  flags: LighthouseOptions,
  config: Config | undefined,
  step: { urlIndex: number; urlsCount: number },
): Promise<ResultForUrl | null> {
  const { urlIndex, urlsCount } = step;

  const prefix = ansis.gray(`[${step.urlIndex + 1}/${step.urlsCount}]`);

  try {
    if (flags.outputPath) {
      await ensureDirectoryExists(path.dirname(flags.outputPath));
    }

    const lhr: Result = await logger.task(
      `${prefix} Running lighthouse on ${url}`,
      async () => {
        const runnerResult: RunnerResult | undefined = await runLighthouse(
          url,
          flags,
          config,
        );

        if (runnerResult == null) {
          throw new Error('Lighthouse did not produce a result');
        }

        return {
          message: `${prefix} Completed lighthouse run on ${url}`,
          result: runnerResult.lhr,
        };
      },
    );

    const auditOutputs = toAuditOutputs(Object.values(lhr.audits), flags);
    if (shouldExpandForUrls(urlsCount)) {
      return {
        url,
        lhr,
        auditOutputs: auditOutputs.map(audit => ({
          ...audit,
          slug: addIndex(audit.slug, urlIndex),
        })),
      };
    }
    return { url, lhr, auditOutputs };
  } catch (error) {
    logger.warn(`Lighthouse run failed for ${url} - ${stringifyError(error)}`);
    return null;
  }
}

function logResultsForAllUrls(results: ResultForUrl[]): void {
  const categoryNames = Object.fromEntries(
    results
      .flatMap(res => Object.values(res.lhr.categories))
      .map(category => [category.id, category.title]),
  );

  logger.info(
    formatAsciiTable({
      columns: [
        { key: 'url', label: 'URL', align: 'left' },
        ...Object.entries(categoryNames).map(
          ([key, label]): TableColumnObject => ({ key, label, align: 'right' }),
        ),
      ],
      rows: results.map(({ url, lhr }) => ({
        url,
        ...Object.fromEntries(
          Object.values(lhr.categories).map(category => [
            category.id,
            category.score == null ? '-' : formatReportScore(category.score),
          ]),
        ),
      })),
    }),
  );
}
