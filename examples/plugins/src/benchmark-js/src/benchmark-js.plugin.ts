import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { LoadOptions, SuiteConfig, loadSuits, runSuite } from './suite-helper';
import { suiteResultToAuditOutput, toAuditMetadata } from './utils';

export type PluginOptions = {
  targets: string[];
  verbose?: boolean;
} & LoadOptions;

export async function create(options: PluginOptions): Promise<PluginConfig> {
  const { tsconfig, targets } = options;
  // load the suites at before returning the plugin config to be able to return a more dynamic config
  const suits = await loadSuits(targets, { tsconfig });

  return {
    slug: 'benchmark-js',
    title: 'Benchmark JS',
    icon: 'folder-benchmark',
    audits: toAuditMetadata(suits.map(({ suiteName }) => suiteName)),
    runner: runnerFunction(suits),
  } satisfies PluginConfig;
}

export function runnerFunction(suites: SuiteConfig[]): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const allSuiteResults = [];
    // Execute each suite sequentially
    // eslint-disable-next-line functional/no-loop-statements
    for (const suite of suites) {
      const result = await runSuite(suite);
      // eslint-disable-next-line functional/immutable-data
      allSuiteResults.push(result);
    }

    // create audit output
    return allSuiteResults.flatMap(results =>
      suiteResultToAuditOutput(results),
    );
  };
}
