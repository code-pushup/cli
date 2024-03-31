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

export type BenchmarkRunner = {
  run: (
    config: SuiteConfig,
    options?: { verbose: false },
  ) => Promise<BenchmarkResult[]>;
};
