import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { SuitConfig, runSuit } from './suit-helper';
import {
  LoadOptions,
  loadSuits,
  suitResultToAuditOutput,
  toAuditMetadata,
} from './utils';

export type PluginOptions = {
  suits: string[];
  verbose?: boolean;
} & LoadOptions;

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
export async function create(options: PluginOptions): Promise<PluginConfig> {
  const { suits: suitNames, tsconfig, targetFolder } = options;
  // load the siutes at before returning the plugin config to be able to return a more dynamic config
  const suits = await loadSuits(suitNames, { tsconfig, targetFolder });

  return {
    slug: 'benchmark-js',
    title: 'Benchmark JS',
    icon: 'flash',
    audits: toAuditMetadata(suitNames),
    runner: runnerFunction(suits),
  } satisfies PluginConfig;
}

export function runnerFunction(suits: SuitConfig[]): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    // execute benchmark
    const allSuitResults = await Promise.all(
      suits.map(async suit => runSuit(suit)),
    );
    // create audit output
    return allSuitResults.flatMap(results => suitResultToAuditOutput(results));
  };
}
