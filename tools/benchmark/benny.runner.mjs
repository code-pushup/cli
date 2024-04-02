import benny from 'benny';
import {join} from "node:path";
import {ensureDirectoryExists} from "../../packages/utils/src";

export const bennyRunner = {
  run: async ({suiteName, cases, targetImplementation}, options = {}) => {
    const {
      outputFolder = join('js-benchmarking'),
    } = options;

    return new Promise((resolve) => {
      // This is not working with named imports
      // eslint-disable-next-line import/no-named-as-default-member
      const suite = benny.suite(
        suiteName,

        ...cases.map(([name, fn]) => benny.add(name, () => {
          fn()
        })),

        benny.cycle(),

        benny.complete((summary) => {
          console.log(summary);
          resolve(
            benchToBenchmarkResult(summary, {
              suiteName,
              cases,
              targetImplementation,
            }),
          )
        }),
        benny.save({file: 'reduce', version: '1.0.0'}),
        benny.save({file: 'reduce', format: 'json', folder: outputFolder})
      );
    })
  }
};

export function benchToBenchmarkResult(
  suite,
  {targetImplementation, suiteName},
) {
  const {name} = suite.fastest;
  return suite.results.map(
    (bench) =>
      ({
        suiteName,
        name: bench.name || '',
        hz: bench.ops ?? 0, // operations per second
        rme: bench.margin ?? 0, // relative margin of error
        // samples not given by benny
        samples: 0, // samples recorded for this case
        isFastest: name === bench.name,
        isTarget: targetImplementation === bench.name,
      })
  );
}

export default bennyRunner;
