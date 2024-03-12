import {Bench} from 'tinybench';

export default {
  run: async ({
                suiteName,
                cases,
                targetImplementation,
                time = 1000,
              }) => {
    // This is not working with named imports
    // eslint-disable-next-line import/no-named-as-default-member
    const suite = new Bench({time});

    // register test cases
    cases.forEach(tuple => suite.add(...tuple));

    await suite.warmup(); // make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
    await suite.run();

    return benchToBenchmarkResult(suite, {
      suiteName,
      cases,
      targetImplementation,
    });
  }
}

export function benchToBenchmarkResult(bench, suite) {
  const caseNames = suite.cases.map(([name]) => name);
  const results = caseNames.map(caseName => {
    const result = bench.getTask(caseName)?.result ?? {};
    return {
      suiteName: suite.suiteName,
      name: caseName,
      hz: result.hz,
      rme: result.rme,
      samples: result.samples.length,
      isTarget: suite.targetImplementation === caseName,
      isFastest: false, // preliminary result
    };
  });

  const fastestName =
    caseNames.reduce(
      (fastest, name) => {
        const {hz} = bench.getTask(name)?.result ?? {};
        if (fastest.name === undefined) {
          return {hz, name};
        }
        if (hz && fastest.hz && hz > fastest.hz) {
          return {hz, name};
        }
        return fastest;
      },
      {hz: 0, name: undefined},
    ).name ?? '';

  return results.map(result => ({
    ...result,
    isFastest: fastestName === result.name,
  }));
}
