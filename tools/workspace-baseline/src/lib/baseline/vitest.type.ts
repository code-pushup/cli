/**
 * Type definitions for Vitest configuration
 * Based on vitest/config UserConfig
 */

export type VitestCoverageOptions = {
  reporter?: string[];
  reportsDirectory?: string;
  exclude?: string[];
  include?: string[];
  enabled?: boolean;
  provider?: 'v8' | 'istanbul' | 'custom';
  clean?: boolean;
  cleanOnRerun?: boolean;
  all?: boolean;
};

export type VitestPoolOptions = {
  threads?: {
    singleThread?: boolean;
    isolate?: boolean;
    minThreads?: number;
    maxThreads?: number;
  };
  forks?: {
    singleFork?: boolean;
    isolate?: boolean;
    minForks?: number;
    maxForks?: number;
  };
};

export type VitestCacheOptions = {
  dir?: string;
};

export type VitestTypecheckOptions = {
  enabled?: boolean;
  include?: string[];
  exclude?: string[];
  only?: boolean;
  checker?: 'tsc' | 'vue-tsc';
};

export type VitestTestConfig = {
  reporters?: string[];
  globals?: boolean;
  cache?: VitestCacheOptions;
  alias?: Record<string, string> | Record<string, string>[];
  pool?: 'threads' | 'forks' | 'vmThreads';
  poolOptions?: VitestPoolOptions;
  environment?: 'node' | 'jsdom' | 'happy-dom' | string;
  include?: string[];
  exclude?: string[];
  globalSetup?: string | string[];
  setupFiles?: string | string[];
  coverage?: VitestCoverageOptions;
  typecheck?: VitestTypecheckOptions;
  testTimeout?: number;
  hookTimeout?: number;
  teardownTimeout?: number;
  isolate?: boolean;
  watch?: boolean;
  root?: string;
  name?: string;
  sequence?: {
    shuffle?: boolean;
    concurrent?: boolean;
    seed?: number;
    hooks?: 'stack' | 'list' | 'parallel';
  };
  bail?: number;
  retry?: number;
  restoreMocks?: boolean;
  clearMocks?: boolean;
  mockReset?: boolean;
  unstubEnvs?: boolean;
  unstubGlobals?: boolean;
  silent?: boolean;
  logHeapUsage?: boolean;
  allowOnly?: boolean;
  dangerouslyIgnoreUnhandledErrors?: boolean;
  passWithNoTests?: boolean;
  maxConcurrency?: number;
  minWorkers?: number;
  maxWorkers?: number;
  fileParallelism?: boolean;
};

export type VitestUserConfig = {
  cacheDir?: string;
  test?: VitestTestConfig;
  define?: Record<string, any>;
  resolve?: {
    alias?:
      | Record<string, string>
      | Array<{ find: string | RegExp; replacement: string }>;
  };
  plugins?: any[];
  esbuild?: any;
  optimizeDeps?: {
    include?: string[];
    exclude?: string[];
  };
};
