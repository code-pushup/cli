import Benchmark, { type Event, type Target } from 'benchmark';

export type SuiteConfig = {
  suitName: string;
  targetImplementation: string;
  cases: [string, (...args: unknown[]) => Promise<unknown>][];
};
export type BenchmarkResult = {
  suitName: string;
  name: string;
  hz: number; // operations per second
  rme: number; // relative margin of error
  samples: number;
  isFastest: boolean;
  isTarget: boolean;
};

export async function runSuit(
  { suitName, cases, targetImplementation }: SuiteConfig,
  options: {
    verbose?: boolean;
  } = { verbose: false },
): Promise<BenchmarkResult[]> {
  const { verbose } = options;

  return new Promise((resolve, reject) => {
    // This is not working with named imports
    // eslint-disable-next-line import/no-named-as-default-member
    const suite = new Benchmark.Suite(suitName);

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
      complete: (event: Event) => {
        const fastest = String(suite.filter('fastest').map('name')[0]);
        const json = (event.currentTarget as unknown as Target[]).map(
          bench =>
            ({
              suitName,
              name: bench.name || '',
              hz: bench.hz ?? 0, // operations per second
              rme: bench.stats?.rme ?? 0, // relative margin of error
              samples: bench.stats?.sample.length ?? 0, // number of samples
              isFastest: fastest === bench.name,
              isTarget: targetImplementation === bench.name,
            } satisfies BenchmarkResult),
        );

        resolve(json);
      },
    }).forEach(([name, fn]) => suite.on(name, fn));

    // register test cases
    cases.forEach(tuple => suite.add(...tuple));

    suite.run({ async: true });
  });
}
