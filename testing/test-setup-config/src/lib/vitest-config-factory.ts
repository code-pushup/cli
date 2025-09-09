import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type UserConfig as ViteUserConfig,
  defineConfig,
  mergeConfig,
} from 'vite';
import type { CoverageOptions, InlineConfig } from 'vitest';
import { tsconfigPathAliases } from './vitest-tsconfig-path-aliases.js';

export type TestKind = 'unit' | 'int' | 'e2e';

export type VitestConfigFactoryOptions = {
  projectKey: string;
  kind: TestKind;
  projectRoot: string | URL;
  cacheKey?: string;
};

export type VitestOverrides = ViteUserConfig & { test?: InlineConfig };
export type ConfigRestParams = Pick<
  VitestConfigFactoryOptions,
  'projectRoot' | 'cacheKey'
>;

export function createVitestConfig(
  options: VitestConfigFactoryOptions,
  overrides: VitestOverrides = {},
): ViteUserConfig {
  const projectRootUrl: URL =
    typeof options.projectRoot === 'string'
      ? pathToFileURL(
          options.projectRoot.endsWith('/')
            ? options.projectRoot
            : `${options.projectRoot}/`,
        )
      : options.projectRoot;
  const cacheDirName = options.cacheKey ?? options.projectKey;

  const coverageEnabled =
    overrides.test?.coverage?.enabled ?? options.kind !== 'e2e';

  const overrideSetupFiles = overrides.test?.setupFiles;
  const setupFiles = overrideSetupFiles
    ? toAbsolutePaths(projectRootUrl, normalizeSetupFiles(overrideSetupFiles))
    : [];

  const baseConfig = buildBaseConfig({
    projectKey: options.projectKey,
    kind: options.kind,
    projectRootUrl,
    cacheDirName,
    coverageEnabled,
    setupFiles,
    overrideExclude:
      (overrides.test?.coverage?.exclude as string[] | undefined) ?? [],
  });

  const normalizedOverrides = sanitizeOverrides(overrides);
  const merged = mergeConfig(
    baseConfig as ViteUserConfig,
    normalizedOverrides as ViteUserConfig,
  );
  return defineConfig(merged);
}

function toAbsolutePaths(
  projectRootUrl: URL,
  paths?: readonly string[],
): string[] {
  return paths && paths.length > 0
    ? paths
        .filter(Boolean)
        .map(p => path.resolve(getProjectRootPath(projectRootUrl), p))
    : [];
}

function normalizeSetupFiles(setupFiles: string | readonly string[]): string[] {
  return Array.isArray(setupFiles)
    ? (setupFiles as string[])
    : [setupFiles as string];
}

function defaultInclude(kind: TestKind): string[] {
  return kind === 'unit'
    ? ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    : kind === 'int'
      ? ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
      : ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'];
}

function defaultGlobalSetup(
  kind: TestKind,
  projectRootUrl: URL,
): string[] | undefined {
  return kind === 'e2e'
    ? undefined
    : [path.resolve(getProjectRootPath(projectRootUrl), 'global-setup.ts')];
}

function buildCoverageConfig(params: {
  projectKey: string;
  kind: TestKind;
  projectRootUrl: URL;
  overrideExclude?: string[];
}): CoverageOptions {
  const defaultExclude = ['mocks/**', '**/types.ts'];
  const reportsDirectory = path.resolve(
    getProjectRootPath(params.projectRootUrl),
    params.kind === 'e2e'
      ? `e2e/${params.projectKey}/.coverage`
      : `packages/${params.projectKey}/.coverage/${params.kind}-tests`,
  );
  return {
    reporter: ['text', 'lcov'],
    reportsDirectory,
    exclude:
      params.overrideExclude && params.overrideExclude.length > 0
        ? [...defaultExclude, ...params.overrideExclude]
        : defaultExclude,
  };
}

function buildBaseConfig(params: {
  projectKey: string;
  kind: TestKind;
  projectRootUrl: URL;
  cacheDirName: string;
  coverageEnabled: boolean;
  setupFiles: string[];
  overrideExclude: string[];
}): VitestOverrides {
  const cfg: VitestOverrides = {
    cacheDir: path.resolve(
      getProjectRootPath(params.projectRootUrl),
      `node_modules/.vite/${params.cacheDirName}`,
    ),
    test: {
      reporters: ['basic'],
      globals: true,
      cache: {
        dir: path.resolve(
          getProjectRootPath(params.projectRootUrl),
          'node_modules/.vitest',
        ),
      },
      alias: tsconfigPathAliases(params.projectRootUrl),
      pool: 'threads',
      poolOptions: { threads: { singleThread: true } },
      environment: 'node',
      include: defaultInclude(params.kind),
      globalSetup: defaultGlobalSetup(params.kind, params.projectRootUrl),
      setupFiles: params.setupFiles,
      ...(params.coverageEnabled
        ? {
            coverage: buildCoverageConfig({
              projectKey: params.projectKey,
              kind: params.kind,
              projectRootUrl: params.projectRootUrl,
              overrideExclude: params.overrideExclude,
            }),
          }
        : {}),
    },
  };
  return cfg;
}

function sanitizeCoverageOptions(
  coverage: unknown,
): CoverageOptions | undefined {
  if (!coverage) {
    return undefined;
  }

  const {
    enabled: _en,
    exclude: _ex,
    ...rest
  } = coverage as CoverageOptions & {
    enabled?: boolean;
    exclude?: string[];
  };
  return rest as CoverageOptions;
}

function sanitizeOverrides(overrides: VitestOverrides): VitestOverrides {
  if (!overrides?.test) {
    return overrides;
  }

  // Remove setupFiles from sanitization since we handle it directly in main logic
  const { setupFiles: _sf, coverage, ...restTest } = overrides.test;
  const sanitizedCoverage = sanitizeCoverageOptions(coverage);

  const sanitizedTest: InlineConfig = sanitizedCoverage
    ? { ...restTest, coverage: sanitizedCoverage }
    : restTest;

  return { ...overrides, test: sanitizedTest };
}

function getProjectRootPath(projectRootUrl: URL): string {
  try {
    return fileURLToPath(projectRootUrl);
  } catch {
    // Fallback for non-file:// URLs or invalid URLs
    const pathname = projectRootUrl.pathname;
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }
}
