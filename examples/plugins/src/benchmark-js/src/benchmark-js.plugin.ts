import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import {
  BenchmarkResult,
  LoadOptions,
  SuiteConfig,
  loadSuites,
  runSuite,
} from './suite-helper';
import { suiteResultToAuditOutput, toAuditMetadata } from './utils';

export type PluginOptions = {
  targets: string[];
  verbose?: boolean;
} & LoadOptions;

export async function create(options: PluginOptions): Promise<PluginConfig> {
  const { tsconfig, targets } = options;
  // load the suites at before returning the plugin config to be able to return a more dynamic config
  const suits = await loadSuites(targets, { tsconfig });

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
    const allSuiteResults: BenchmarkResult[][] = [];
    // Execute each suite sequentially
    // eslint-disable-next-line functional/no-loop-statements
    for (const suite of suites) {
      const result: BenchmarkResult[] = await runSuite(suite);
      // eslint-disable-next-line functional/immutable-data
      allSuiteResults.push(result);
    }

    // create audit output
    return allSuiteResults.map(results => suiteResultToAuditOutput(results));
  };
}
