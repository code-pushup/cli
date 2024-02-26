import { join } from 'node:path';
import {
  Audit,
  AuditOutput,
  AuditOutputs,
  Group,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { importEsmModule, slugify } from '@code-pushup/utils';
import { SuitOptions, runSuit } from './suit-helper';
import { BenchmarkJSRunnerOptions, toAuditSlug } from './utils';

export type PluginOptions = { verbose: boolean } & {
  suits: string[];
} & BenchmarkJSRunnerOptions;

/**
 * @example
 * // code-pushup.config.ts
 * import { create as jsBenchmarkPlugin } from 'jsBenchmark.plugin.ts';
 *
 * export default {
 *   plugins: [
 *     jsBenchmarkPlugin({ suits: ['crawl-file-system'] })
 *   ],
 *   categories: [
 *     {
 *       slug: 'performance',
 *       title: 'Performance',
 *       refs: [
 *         ...jsBenchmarkPluginRecommended
 *       ]
 *     }
 *   ]
 * }
 *
 */
export async function create(
  options: {
    suits: string[];
    targetFolder: string;
  } & BenchmarkJSRunnerOptions,
): Promise<PluginConfig> {
  const { suits: suitNames, tsconfig, targetFolder } = options;
  const results = await Promise.all(
    suitNames.map(async (suitName: string) => {
      const r = (await importEsmModule({
        tsconfig,
        filepath: join(targetFolder, suitName, 'index.ts'),
      })) as SuitOptions;
      return r;
    }),
  );

  const audits = results.flatMap(({ suitName, cases }) =>
    cases.map(
      ([name]) =>
        ({
          slug: toAuditSlug(suitName, name),
          title: `${suitName} ${name} Benchmark JS`,
        } satisfies Audit),
    ),
  );

  return {
    slug: 'benchmark-js',
    title: 'Benchmark JS',
    icon: 'flash',
    audits,
    groups: results.map(
      ({ suitName, cases }) =>
        ({
          slug: `${slugify(suitName)}-benchmark-js`,
          title: `${suitName} Benchmark JS`,
          refs: cases.map(([name]) => ({
            slug: toAuditSlug(suitName, name),
            title: `${suitName} ${name} Benchmark JS`,
            weight: 1,
          })),
        } satisfies Group),
    ),
    runner: runnerFunction({ ...options, suits: results }),
  } satisfies PluginConfig;
}

export function runnerFunction(
  options: {
    suits: SuitOptions[];
    targetFolder: string;
  } & BenchmarkJSRunnerOptions,
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const { suits } = options;

    const allResults = await Promise.all(
      suits.map(async suit => {
        return runSuit(suit);
      }),
    );

    return allResults.flatMap(results => {
      const { suitName = '' } =
        results.find(({ isFastest }) => isFastest === 1) ?? {};
      return results.map(
        ({ name = '', hz = 0 }) =>
          ({
            slug: toAuditSlug(suitName, name),
            displayValue: `${hz} ops/sec`,
            score: name === 'current-implementation' ? 1 : 0,
            value: parseInt(hz.toString(), 10),
          } satisfies AuditOutput),
      );
    });
  };
}
