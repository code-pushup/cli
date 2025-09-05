/// <reference types="vitest" />
import { pathToFileURL } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import type { UserConfig as ViteUserConfig } from 'vite';
import type { CoverageOptions } from 'vitest';
import { setupPresets } from './vitest-setup-presets.js';
import { tsconfigPathAliases } from './vitest-tsconfig-path-aliases.js';

export type TestKind = 'unit' | 'int' | 'e2e';

export interface CreateVitestConfigOptions {
  projectKey: string;
  kind: TestKind;
  projectRoot: string | URL;
  include?: string[];
  setupFiles?: string[];
  /** If true, the factory will not inject the baseline setupFiles for the given kind. */
  overrideSetupFiles?: boolean;
  globalSetup?: string[];
  coverage?: {
    enabled?: boolean;
    exclude?: string[];
  };
  testTimeout?: number;
  typecheckInclude?: string[];
  cacheKey?: string;
}

export function createVitestConfig(
  options: CreateVitestConfigOptions,
): ViteUserConfig {
  const projectRootUrl: URL =
    typeof options.projectRoot === 'string'
      ? pathToFileURL(
          options.projectRoot.endsWith('/')
            ? options.projectRoot
            : options.projectRoot + '/',
        )
      : options.projectRoot;
  const cacheDirName = options.cacheKey ?? options.projectKey;
  const coverageEnabled = options.coverage?.enabled ?? options.kind !== 'e2e';
  const defaultGlobalSetup =
    options.kind === 'e2e'
      ? undefined
      : [new URL('global-setup.ts', projectRootUrl).pathname];

  type VitestAwareUserConfig = ViteUserConfig & { test?: unknown };
  const baselineSetupByKind: Record<TestKind, readonly string[]> = {
    unit: setupPresets.unit.base,
    int: setupPresets.int.base,
    e2e: setupPresets.e2e.base,
  } as const;

  const resolveFromRoot = (relativePath: string): string =>
    new URL(relativePath, projectRootUrl).pathname;
  const mapToAbsolute = (
    paths: readonly string[] | undefined,
  ): string[] | undefined =>
    paths == null ? paths : paths.map(resolveFromRoot);

  const defaultExclude = ['mocks/**', '**/types.ts'];

  const baselineSetupAbs = mapToAbsolute(baselineSetupByKind[options.kind])!;
  const extraSetupAbs = mapToAbsolute(options.setupFiles) ?? [];
  const finalSetupFiles = options.overrideSetupFiles
    ? extraSetupAbs
    : extraSetupAbs.length > 0
      ? [...baselineSetupAbs, ...extraSetupAbs]
      : undefined; // let base keep baseline when no extras

  const baseConfig: VitestAwareUserConfig = {
    cacheDir: new URL(`node_modules/.vite/${cacheDirName}`, projectRootUrl)
      .pathname,
    test: {
      reporters: ['basic'],
      globals: true,
      cache: { dir: new URL('node_modules/.vitest', projectRootUrl).pathname },
      alias: tsconfigPathAliases(),
      pool: 'threads',
      poolOptions: { threads: { singleThread: true } },
      environment: 'node',
      include:
        options.kind === 'unit'
          ? ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
          : options.kind === 'int'
            ? ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
            : ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      globalSetup: defaultGlobalSetup,
      setupFiles: baselineSetupAbs,
      ...(coverageEnabled
        ? {
            coverage: {
              reporter: ['text', 'lcov'],
              reportsDirectory: new URL(
                options.kind === 'e2e'
                  ? `e2e/${options.projectKey}/.coverage`
                  : `packages/${options.projectKey}/.coverage`,
                projectRootUrl,
              ).pathname,
              exclude: defaultExclude,
            } as CoverageOptions,
          }
        : {}),
    },
  };

  const overrideConfig: VitestAwareUserConfig = {
    test: {
      ...(options.include ? { include: options.include } : {}),
      ...(options.globalSetup
        ? { globalSetup: mapToAbsolute(options.globalSetup) }
        : {}),
      ...(finalSetupFiles ? { setupFiles: finalSetupFiles } : {}),
      ...(options.typecheckInclude
        ? { typecheck: { include: options.typecheckInclude } }
        : {}),
      ...(options.testTimeout != null
        ? { testTimeout: options.testTimeout }
        : {}),
      ...(coverageEnabled && options.coverage?.exclude
        ? {
            coverage: {
              exclude: [...defaultExclude, ...options.coverage.exclude],
            } as CoverageOptions,
          }
        : {}),
    },
  };

  const merged = mergeConfig(
    baseConfig as ViteUserConfig,
    overrideConfig as ViteUserConfig,
  );
  return defineConfig(merged);
}

export const createUnitConfig = (
  projectKey: string,
  rest: Omit<CreateVitestConfigOptions, 'projectKey' | 'kind'>,
): ViteUserConfig => createVitestConfig({ projectKey, kind: 'unit', ...rest });

export const createIntConfig = (
  projectKey: string,
  rest: Omit<CreateVitestConfigOptions, 'projectKey' | 'kind'>,
): ViteUserConfig => createVitestConfig({ projectKey, kind: 'int', ...rest });

export const createE2eConfig = (
  projectKey: string,
  rest: Omit<CreateVitestConfigOptions, 'projectKey' | 'kind'>,
): ViteUserConfig => createVitestConfig({ projectKey, kind: 'e2e', ...rest });
