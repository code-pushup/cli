import { tsconfigPathAliases } from './tsconfig-path-aliases.js';

// Test timeout constants
const UNIT_TEST_TIMEOUT = 5000;
const INTEGRATION_TEST_TIMEOUT = 15_000;
const E2E_TEST_TIMEOUT = 30_000;

export type SharedVitestConfigOptions = {
  projectRoot: string;
  workspaceRoot: string;
};

// Define a unified coverage config interface
type CoverageConfig = {
  enabled?: boolean;
  provider: 'v8';
  reporter: ('text' | 'lcov')[];
  reportsDirectory: string;
  include: string[];
  exclude: string[];
};

type SharedVitestConfig = {
  root: string;
  cacheDir: string;
  test: {
    coverage: CoverageConfig;
    watch: boolean;
    globals: boolean;
    environment: 'node' | 'jsdom' | 'happy-dom';
    include: string[];
    reporters: 'basic'[];
    passWithNoTests: boolean;
    testTimeout: number;
    alias: ReturnType<typeof tsconfigPathAliases>;
    setupFiles: string[];
    cache: {
      dir: string;
    };
    pool: 'threads';
    poolOptions: {
      threads: {
        singleThread: boolean;
      };
    };
    globalSetup: string[];
    typecheck?: {
      include: string[];
    };
  };
};

function getDefaultTestSettings(
  testType: string,
  defaultTimeout: number,
  noFsCwd = false,
) {
  return {
    enabled: true,
    environment: 'node' as const,
    include: [`src/**/*.${testType}.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`],
    exclude: [
      'mocks/**',
      '**/types.ts',
      '**/__snapshots__/**',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/index.ts',
    ],
    testTimeout: defaultTimeout,
    setupFiles: [
      noFsCwd
        ? '../../testing/test-setup/src/lib/fs-memfs.setup-file.ts' // Only fs, no cwd
        : '../../testing/test-setup/src/lib/fs-with-cwd.setup-file.ts', // fs + cwd
      '../../testing/test-setup/src/lib/cliui.mock.ts',
      '../../testing/test-setup/src/lib/git.mock.ts',
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
      '../../testing/test-setup/src/lib/portal-client.mock.ts',
      '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
      '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
      '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
    ],
  };
}

function getProjectPaths(
  projectRoot: string,
  workspaceRoot: string,
  testType: string,
) {
  const pathSeparator = projectRoot.includes('/') ? '/' : '\\';
  const pathParts = projectRoot.split(pathSeparator);
  const PROJECT_NAME_PARTS = 2;
  const projectName = pathParts.slice(-PROJECT_NAME_PARTS).join('-');
  const coverageDir = `${workspaceRoot}/coverage/${projectName}/${testType}`;
  const cacheDir = `${workspaceRoot}/node_modules/.vite/${projectName}`;

  return { projectName, coverageDir, cacheDir };
}

function createSharedVitestConfig(
  options: SharedVitestConfigOptions,
  testType: 'unit' | 'integration' | 'e2e',
  defaultTimeout: number,
  noFsCwd = false,
): SharedVitestConfig {
  const { projectRoot, workspaceRoot } = options;
  const settings = getDefaultTestSettings(testType, defaultTimeout, noFsCwd);
  const paths = getProjectPaths(projectRoot, workspaceRoot, testType);

  const coverage: CoverageConfig = {
    enabled: settings.enabled,
    provider: 'v8',
    reporter: ['text', 'lcov'],
    reportsDirectory: paths.coverageDir,
    include: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: settings.exclude,
  };

  return {
    root: projectRoot,
    cacheDir: paths.cacheDir,
    test: {
      coverage,
      watch: false,
      globals: true,
      environment: settings.environment,
      include: settings.include,
      reporters: ['basic'],
      passWithNoTests: true,
      testTimeout: settings.testTimeout,
      alias: tsconfigPathAliases(),
      setupFiles: settings.setupFiles,
      cache: {
        dir: `${workspaceRoot}/node_modules/.vitest`,
      },
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
      globalSetup: [`${workspaceRoot}/global-setup.ts`],
    },
  };
}

export function createSharedUnitVitestConfig(
  options: SharedVitestConfigOptions,
  noFsCwd = false,
): SharedVitestConfig {
  return createSharedVitestConfig(options, 'unit', UNIT_TEST_TIMEOUT, noFsCwd);
}

export function createSharedIntegrationVitestConfig(
  options: SharedVitestConfigOptions,
): SharedVitestConfig {
  return createSharedVitestConfig(
    options,
    'integration',
    INTEGRATION_TEST_TIMEOUT,
  );
}

export function createSharedE2eVitestConfig(
  options: SharedVitestConfigOptions,
): SharedVitestConfig {
  return createSharedVitestConfig(options, 'e2e', E2E_TEST_TIMEOUT);
}
