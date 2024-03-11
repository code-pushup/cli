import { Bench, TaskResult } from 'tinybench';
import { importEsmModule } from '@code-pushup/utils';

export type SuiteConfig = {
  suiteName: string;
  targetImplementation: string;
  cases: [string, (...args: unknown[]) => Promise<unknown>][];
  time?: number;
};
export type BenchmarkResult = {
  hz: number;
  rme: number;
  samples: number;
  suiteName: string;
  name: string;
  isFastest: boolean;
  isTarget: boolean;
};

export type LoadOptions = {
  tsconfig?: string;
};

export function loadSuites(
  targets: string[],
  options: LoadOptions = {},
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

export async function runSuite({
  suiteName,
  cases,
  targetImplementation,
  time = 1000,
}: SuiteConfig): Promise<BenchmarkResult[]> {
  // This is not working with named imports
  // eslint-disable-next-line import/no-named-as-default-member
  const suite = new Bench({ time });

  // register test cases
  cases.forEach(tuple => suite.add(...tuple));

  await suite.warmup(); // make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
  await suite.run();

  return benchToBenchmarkResult(suite, {
    suiteName,
    cases,
    targetImplementation,
    time,
  });
}

export function benchToBenchmarkResult(
  bench: Bench,
  suite: SuiteConfig,
): BenchmarkResult[] {
  const caseNames = suite.cases.map(([name]) => name);
  const results = caseNames
    .map(caseName => {
      const result = bench.getTask(caseName)?.result ?? ({} as TaskResult);
      return {
        suiteName: suite.suiteName,
        name: caseName,
        hz: result.hz,
        rme: result.rme,
        samples: result.samples.length,
        isTarget: suite.targetImplementation === caseName,
        isFastest: false, // preliminary result
      } satisfies BenchmarkResult;
    })
    // sort by hz to get fastest at the top
    .sort(({ hz: hzA }, { hz: hzB }) => hzA - hzB);

  return results.map(result =>
    results.at(1)?.name === result.name
      ? { ...result, isFastest: true }
      : result,
  );
}
