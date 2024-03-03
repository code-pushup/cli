import { type Event, type Target } from 'benchmark';
import {importCjsBundle} from "@code-pushup/utils";

export type SuitConfig = {
  suitName: string;
  targetImplementation: string;
  cases: [string, () => void][];
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
  { suitName, cases, targetImplementation }: SuitConfig,
  options: {
    verbose?: boolean;
    maxTime: number;
  } = { verbose: false, maxTime: 4500 },
): Promise<BenchmarkResult[]> {
  const { verbose, maxTime } = options;
  // @TODO figure out how to import it in esm. This would allow better testing and simpler code.
  const Benchmark = await importCjsBundle('benchmark').then(({ default: m }) => m);
  const { Suite } = Benchmark;

  return new Promise((resolve, reject) => {
    const suite = new Suite(suitName, { maxTime });

    // Add Listener
    Object.entries({
      error: reject,
      cycle: function (event: Event) {
        verbose && console.log(String(event.target));
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
