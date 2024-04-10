import Benchmark, { Event, type Suite, type Target } from 'benchmark';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JS_BENCHMARKING_PLUGIN_SLUG } from '../constants';
import type {
  BenchmarkResult,
  BenchmarkRunner,
  BenchmarkRunnerOptions,
  SuiteConfig,
} from './types';

export const benchmarkRunner = {
  run: async (
    { suiteName, cases, targetImplementation }: SuiteConfig,
    options: BenchmarkRunnerOptions = {},
  ): Promise<BenchmarkResult[]> => {
    const {
      verbose = false,
      outputFileName: fileName = 'benchmark-report',
      outputDir: folder = JS_BENCHMARKING_PLUGIN_SLUG,
    } = options;

    return new Promise((resolve, reject) => {
      // This is not working with named imports
      // eslint-disable-next-line import/no-named-as-default-member
      const suite = new Benchmark.Suite(suiteName);

      // Add Listener
      Object.entries({
        error: (e: { target?: { error?: unknown } }) => {
          reject(e.target?.error ?? e);
        },
        cycle: function (event: Event) {
          if (verbose) {
            // @TODO use cliui.logger.info(String(event.target))
            // eslint-disable-next-line no-console
            console.log(String(event.target));
          }
        },
        complete: () => {
          const result = benchToBenchmarkResult(suite, {
            suiteName,
            cases,
            targetImplementation,
          });
          if (fileName || folder) {
            void writeFile(
              join(folder, `${fileName}.json`),
              JSON.stringify(result, null, 2),
            ).then(() => {
              resolve(result);
            });
          } else {
            resolve(result);
          }
        },
      }).forEach(([name, fn]) => suite.on(name, fn));

      // register test cases
      cases.forEach(tuple => suite.add(...tuple));

      suite.run({ async: true });
    });
  },
} satisfies BenchmarkRunner;

export function benchToBenchmarkResult(
  suite: Suite,
  { targetImplementation, suiteName }: SuiteConfig,
): BenchmarkResult[] {
  const fastest = String(suite.filter('fastest').map('name')[0]);
  return suite.map(
    (bench: Target) =>
      ({
        suiteName,
        name: bench.name || '',
        hz: bench.hz ?? 0, // operations per second
        rme: bench.stats?.rme ?? 0, // relative margin of error
        samples: bench.stats?.sample.length ?? 0, // number of samples
        isFastest: fastest === bench.name,
        isTarget: targetImplementation === bench.name,
      } satisfies BenchmarkResult),
  ) as BenchmarkResult[]; // suite.map has a broken typing
}

export default benchmarkRunner;
