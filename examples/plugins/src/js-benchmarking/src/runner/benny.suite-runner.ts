import benny from 'benny';
import {BenchmarkResult, BenchmarkRunnerOptions, SuiteConfig} from './types';
import type {Summary} from "benny/lib/internal/common-types";
import {JS_BENCHMARKING_PLUGIN_SLUG} from "../constants";

export const bennyRunner = {
  run: async (
    {suiteName, cases, targetImplementation}: SuiteConfig,
    options: BenchmarkRunnerOptions = {},
  ): Promise<BenchmarkResult[]> => {
    const {
      outputFileName: file = 'benny-report',
      outputDir: folder = JS_BENCHMARKING_PLUGIN_SLUG,
    } = options;

    return new Promise((resolve) => {
      // This is not working with named imports
      void benny.suite(
        suiteName,
        ...cases.map(([name, fn]) => benny.add(name, () => {
          fn()
        })),

        benny.cycle(),

        benny.complete((summary) => {
          resolve(
            benchToBenchmarkResult(summary, {
              suiteName,
              cases,
              targetImplementation,
            }),
          )
        }),
        benny.save({file, folder, format: 'json', details: true})
      );
    });
  }
};

export function benchToBenchmarkResult(
  suite: Summary,
  {targetImplementation, suiteName}: SuiteConfig,
) {
  const {name: fastestName} = suite.fastest;
  return suite.results.map(
    ({ops, name: caseName, details}) =>
      ({
        suiteName,
        name: caseName || '',
        hz: ops, // operations per second
        rme: details.relativeMarginOfError, // relative margin of error
        samples: details.sampleResults.length, // samples recorded for this case
        isFastest: fastestName === caseName,
        isTarget: targetImplementation === caseName,
      })
  );
}

export default bennyRunner;
