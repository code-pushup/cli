import Benchmark, { type Event, type Target } from 'benchmark';
import { importEsmModule } from '@code-pushup/utils';

export type SuiteConfig = {
  suiteName: string;
  targetImplementation: string;
  cases: [string, (...args: unknown[]) => Promise<unknown>][];
};
export type BenchmarkResult = {
  suiteName: string;
  name: string;
  hz: number; // operations per second
  rme: number; // relative margin of error
  samples: number;
  isFastest: boolean;
  isTarget: boolean;
};

export type LoadOptions = {
  tsconfig?: string;
};

export function loadSuites(
  targets: string[],
  options: LoadOptions,
): Promise<SuiteConfig[]> {
  const { tsconfig } = options;
  return Promise.all(
    targets.map(
      (filepath: string) =>
        importEsmModule({
          tsconfig,
          filepath,
        }) as Promise<SuiteConfig>,
    ),
  );
}

export async function runSuite(
  { suiteName, cases, targetImplementation }: SuiteConfig,
  options: {
    verbose?: boolean;
    outputPath?: string;
  } = { verbose: false },
): Promise<BenchmarkResult[]> {
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
      complete: (event: Event) => {
        const fastest = String(suite.filter('fastest').map('name')[0]);
        const json = (event.currentTarget as unknown as Target[]).map(
          bench =>
            ({
              suiteName,
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
