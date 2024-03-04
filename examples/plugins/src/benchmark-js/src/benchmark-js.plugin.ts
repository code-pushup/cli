import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { SuiteConfig, runSuite } from './suite-helper';
import {
  LoadOptions,
  loadSuits,
  suitResultToAuditOutput,
  toAuditMetadata,
} from './utils';

export type PluginOptions = {
  targets: string[];
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
  const { tsconfig, targets } = options;
  // load the suites at before returning the plugin config to be able to return a more dynamic config
  const suits = await loadSuits(targets, { tsconfig });

  return {
    slug: 'benchmark-js',
    title: 'Benchmark JS',
    icon: 'flash',
    audits: toAuditMetadata(suits.map(({ suiteName }) => suiteName)),
    runner: runnerFunction(suits),
  } satisfies PluginConfig;
}

export function runnerFunction(suits: SuiteConfig[]): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    // execute benchmark
    const allSuiteResults = await Promise.all(
      suits.map(async suit => runSuite(suit)),
    );
    // create audit output
    return allSuiteResults.flatMap(results => suitResultToAuditOutput(results));
  };
}
