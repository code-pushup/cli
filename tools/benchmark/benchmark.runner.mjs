import Benchmark from 'benchmark';

export default {
  run: async (
    {suiteName, cases, targetImplementation, tsconfig},
    options = {verbose: false},
  ) => {
    const {verbose, maxTime} = options;

    return new Promise((resolve, reject) => {
      const suite = new Benchmark.Suite(suiteName);

      // Add Listener
      Object.entries({
        error: e => reject(e?.target?.error ?? e),
        cycle: function (event) {
          verbose && console.log(String(event.target));
        },
        complete: event => {
          const fastest = String(suite.filter('fastest').map('name')[0]);
          const json = event.currentTarget.map(bench => ({
            suiteName,
            name: bench.name || '',
            hz: bench.hz ?? 0, // operations per second
            rme: bench.stats?.rme ?? 0, // relative margin of error
            samples: bench.stats?.sample.length ?? 0, // number of samples
            isFastest: fastest === bench.name,
            isTarget: targetImplementation === bench.name,
          }));

          resolve(json);
        },
      }).forEach(([name, fn]) => suite.on(name, fn));

      // register test cases
      cases.forEach(tuple => suite.add(...tuple));

      suite.run({async: true});
    });
  }
}
