import type { CoverageOptions } from 'vitest';
import { type UserConfig as ViteUserConfig, defineConfig } from 'vitest/config';
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
        'src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'src/**/*.type.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ];
    case 'int':
      return ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'];
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

  const exclude = ['mocks/**', '**/types.ts', 'perf/**'];
  const reportsDirectory = `../../coverage/${projectKey}/${kind}-tests`;

  return {
    reporter: ['text', 'lcov'],
    reportsDirectory,
    exclude: exclude,
  };
}

export function createVitestConfig(
  projectKey: string,
  kind: TestKind,
  options?: E2ETestOptions,
): ViteUserConfig {
  const coverage = buildCoverageConfig(projectKey, kind);

  const config: ViteUserConfig = {
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

  return defineConfig(config);
}
