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
  samples: number;
  suiteName: string;
  name: string;
  isFastest: boolean;
  isTarget: boolean;
};

export type BenchmarkRunner = {
  run: (
    config: SuiteConfig,
    options?: { verbose: false },
  ) => Promise<BenchmarkResult[]>;
};
