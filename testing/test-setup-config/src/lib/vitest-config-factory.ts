import type { CoverageOptions } from 'vitest';
import type { UserConfig as ViteUserConfig } from 'vitest/config';
import { getSetupFiles } from './vitest-setup-files.js';
import { tsconfigPathAliases } from './vitest-tsconfig-path-aliases.js';

export type TestKind = 'unit' | 'int' | 'e2e';

export type E2ETestOptions = {
  testTimeout?: number;
};

function getIncludePatterns(kind: TestKind): string[] {
  switch (kind) {
    case 'unit':
      return [
        'mocks/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'src/**/*.type.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ];
    case 'int':
      return [
        'mocks/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ];
    case 'e2e':
      return ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'];
  }
}

function buildCoverageConfig(
  projectKey: string,
  kind: TestKind,
): CoverageOptions | undefined {
  if (kind === 'e2e') {
    return undefined;
  }

  const exclude = [
    'tests/**',
    'perf/**',
    // Mocks and fixtures
    'mocks/**',
    '**/fixtures/**',
    '**/*.mock.ts',
    '**/*.fixture.ts',
    // Config files
    '**/vitest.*.config.ts',
    '**/vitest.config.ts',
    '**/code-pushup.config.ts',
    '**/*.config.ts',
    // Barrel files (index files that only re-export)
    '**/index.ts',
    '**/index.js',
    '**/index.mjs',
    // Model files
    '**/models.ts',
    '**/*.model.ts',
    '**/types.ts',
    '**/*.type.ts',
    // Constants
    '**/constants.ts',
    // typings
    '**/*.d.ts',
  ];
  const reportsDirectory = `../../coverage/${projectKey}/${kind}-tests`;

  return {
    reporter: ['text', 'lcov'],
    reportsDirectory,
    exclude,
  };
}

export function createVitestConfig(
  projectKey: string,
  kind: TestKind,
  options?: E2ETestOptions,
): ViteUserConfig {
  const coverage = buildCoverageConfig(projectKey, kind);

  return {
    cacheDir: `../../node_modules/.vite/${projectKey}`,
    test: {
      reporters: ['basic'],
      globals: true,
      cache: {
        dir: '../../node_modules/.vitest',
      },
      alias: tsconfigPathAliases(),
      pool: 'threads',
      poolOptions: { threads: { singleThread: true } },
      environment: 'node',
      include: getIncludePatterns(kind),
      globalSetup: ['../../global-setup.ts'],
      setupFiles: [...getSetupFiles(kind)],
      ...(options?.testTimeout ? { testTimeout: options.testTimeout } : {}),
      ...(coverage ? { coverage } : {}),
      ...(kind === 'unit'
        ? { typecheck: { include: ['**/*.type.test.ts'] } }
        : {}),
    },
  };
}
