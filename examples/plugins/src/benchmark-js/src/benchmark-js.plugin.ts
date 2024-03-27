import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { runner } from './benchmark.suite-runner';
import {
  BenchmarkResult,
  LoadOptions,
  SuiteConfig,
  loadSuites,
  suiteResultToAuditOutput,
  toAuditMetadata,
} from './utils';

export type PluginOptions = {
  targets: string[];
  outputDir?: string;
  verbose?: boolean;
} & LoadOptions;

export async function create(options: PluginOptions): Promise<PluginConfig> {
  const { tsconfig, targets, outputDir } = options;
  // load the suites at before returning the plugin config to be able to return a more dynamic config
  const suites = await loadSuites(targets, { tsconfig });

  return {
    slug: 'benchmark-js',
    title: 'Benchmark JS',
    icon: 'folder-benchmark',
    audits: toAuditMetadata(suites.map(({ suiteName }) => suiteName)),
    runner: runnerFunction(suites, { outputDir }),
  } satisfies PluginConfig;
}

export function runnerFunction(
  suites: SuiteConfig[],
  options: { outputDir?: string },
): RunnerFunction {
  const { outputDir } = options;
  return async (): Promise<AuditOutputs> => {
    const allSuiteResults: BenchmarkResult[][] = [];
    // Execute each suite sequentially
    // eslint-disable-next-line functional/no-loop-statements
    for (const suite of suites) {
      const result: BenchmarkResult[] = await runner.run(suite);
      if (outputDir && outputDir !== '') {
        await writeFile(
          join(outputDir, `${suite.suiteName}-benchmark.json`),
          JSON.stringify(result, null, 2),
        );
      }
      // eslint-disable-next-line functional/immutable-data
      allSuiteResults.push(result);
    }

    // create audit output
    return allSuiteResults.map(results => suiteResultToAuditOutput(results));
  };
}
