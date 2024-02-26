import { type Event, type Target } from 'benchmark';

export type BenchmarkResult = {
  suitName: string;
  name: string;
  hz: number; // operations per second
  rme: number; // relative margin of error
  samples: number;
  isFastest: number;
};
export type SuitOptions = {
  tsconfig?: string;
  suitName: string;
  cases: [string, () => void][];
  verbose?: true;
};

export async function runSuit({
  verbose = true,
  suitName,
  cases,
}: SuitOptions): Promise<BenchmarkResult[]> {
  const Benchmark = await import('benchmark').then(({ default: m }) => m);
  const { Suite } = Benchmark;

  return new Promise((resolve, reject) => {
    const suite = new Suite(suitName);

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
              isFastest: fastest === bench.name ? 1 : 0,
            } satisfies BenchmarkResult),
        );

        resolve(json);
      },
    }).forEach(([name, fn]) => {
      suite.on(name, fn);
    });

    // register test cases
    cases.forEach(tuple => suite.add(...tuple));

    // eslint-disable-next-line functional/immutable-data
    suite.run({
      async: true,
    });
  });
}
