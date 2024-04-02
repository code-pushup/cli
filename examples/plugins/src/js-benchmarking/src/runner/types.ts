export type SuiteConfig = {
  suiteName: string;
  targetImplementation: string;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  cases: [string, (...args: unknown[]) => Promise<unknown> | unknown][];
  time?: number;
};

export type BenchmarkResult = {
  hz: number;
  rme: number;
  suiteName: string;
  name: string;
  isFastest: boolean;
  isTarget: boolean;
  // not given in all benchmark implementations
  samples?: number;
};

export type BenchmarkRunnerOptions = {
  verbose?: boolean;
  outputDir?: string;
  outputFileName?: string;
};
export type BenchmarkRunner = {
  run: (
    config: SuiteConfig,
    options?: BenchmarkRunnerOptions,
  ) => Promise<BenchmarkResult[]>;
};
