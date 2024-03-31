import Benchmark, { Event, type Suite, type Target } from 'benchmark';
import type { BenchmarkResult, BenchmarkRunner, SuiteConfig } from './types';

export const bencnmarkRunner = {
  run: async (
    { suiteName, cases, targetImplementation }: SuiteConfig,
    options: {
      verbose?: boolean;
    } = { verbose: false },
  ): Promise<BenchmarkResult[]> => {
    const { verbose } = options;

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
          resolve(
            benchToBenchmarkResult(suite, {
              suiteName,
              cases,
              targetImplementation,
            }),
          );
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

export default bencnmarkRunner;
