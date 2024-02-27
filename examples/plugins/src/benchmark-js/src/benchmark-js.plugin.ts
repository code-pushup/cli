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
import {
  BenchmarkJSRunnerOptions,
  BenchmarkResult,
  toAuditSlug,
} from './utils';

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
 *         ...jsBenchmarkPluginRecommended(suits)
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
  const suits = await Promise.all(
    suitNames.map(async (suitName: string) => {
      const options = (await importEsmModule({
        tsconfig,
        filepath: join(targetFolder, suitName, 'index.ts'),
      })) as SuitOptions;
      return options;
    }),
  );

  const audits = suits.flatMap(({ suitName, cases }) =>
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
    groups: suits.map(
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
    runner: runnerFunction({ ...options, suits: suits }),
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

    const allSuitResults = await Promise.all(
      suits.map(async suit => {
        return runSuit(suit);
      }),
    );

    return allSuitResults.flatMap(results => {
      const { hz: maxHz = 0 } =
        results.find(({ isFastest }) => isFastest) ?? {};
      const target =  results.find(({ isTarget }) => isTarget) ?? {} as BenchmarkResult;
      return scoredAuditOutput(target, maxHz);
    });
  };
}

/**
 * scoring of js computation time can be used in 2 ways:
 * - many implementations against the current implementation to maintain the fastest (score is 100 based on fastest)
 * - testing many implementations/libs to pick the fastest
 * @param result
 */
export function scoredAuditOutput(result: BenchmarkResult, maxHz: number ): AuditOutput {
  const {suitName, name, hz} = result;
  return {
    slug: toAuditSlug(suitName, name),
    displayValue: `${hz.toFixed(3)} ops/sec`,
    // score is based on fastest implementation (fastest is 100%)
    score: hz / maxHz,
    value: parseInt(hz.toString(), 10),
  };
}

