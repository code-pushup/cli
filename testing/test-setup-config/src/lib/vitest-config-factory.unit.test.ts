import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type TestKind,
  type VitestConfigFactoryOptions,
  type VitestOverrides,
  createVitestConfig,
} from './vitest-config-factory.js';

// Only mock defineConfig - assume it works correctly, we're not testing Vite
// Use importOriginal to keep mergeConfig real while mocking defineConfig
vi.mock('vite', async importOriginal => {
  const actual = await importOriginal<typeof import('vite')>();
  return {
    ...actual,
    defineConfig: vi.fn(config => config),
  };
});

// Mock tsconfigPathAliases since it reads from filesystem and our fake paths don't exist
vi.mock('./vitest-tsconfig-path-aliases.js', () => ({
  tsconfigPathAliases: vi.fn().mockReturnValue({ '@mock/alias': '/mock/path' }),
}));

const MOCK_PROJECT_ROOT_STRING = '/Users/test/project';
const MOCK_PROJECT_ROOT_URL = pathToFileURL(`${MOCK_PROJECT_ROOT_STRING}/`);

// Cross-platform path helpers to match what the actual code generates
const mockPath = (...segments: string[]) =>
  path.resolve(MOCK_PROJECT_ROOT_STRING, ...segments);
const mockCacheDir = (name: string) => mockPath('node_modules', '.vite', name);
const mockVitestCacheDir = () => mockPath('node_modules', '.vitest');
const mockGlobalSetup = () => mockPath('global-setup.ts');
const mockReportsDir = (projectKey: string, kind: string) =>
  kind === 'e2e'
    ? mockPath('e2e', projectKey, '.coverage')
    : mockPath('packages', projectKey, '.coverage', `${kind}-tests`);
const mockSetupFile = mockPath;

const TEST_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10_000,
  LONG: 30_000,
} as const;

const EXPECTED_INCLUDES = {
  unit: ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  int: ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  e2e: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
} as const;

const DEFAULT_EXCLUDES = ['mocks/**', '**/types.ts'] as const;

const expectCoverageConfig = (config: any, expectedProps: Partial<any>) => {
  expect(config.test.coverage).toEqual(expect.objectContaining(expectedProps));
};

describe('createVitestConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should create a basic unit test config with string projectRoot', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const config = createVitestConfig(options);

      expect(config).toEqual(
        expect.objectContaining({
          cacheDir: mockCacheDir('test-package'),
          test: expect.objectContaining({
            reporters: ['basic'],
            globals: true,
            cache: {
              dir: mockVitestCacheDir(),
            },
            alias: expect.any(Object),
            pool: 'threads',
            poolOptions: { threads: { singleThread: true } },
            environment: 'node',
            include: EXPECTED_INCLUDES.unit,
            globalSetup: [mockGlobalSetup()],
            setupFiles: [],
            coverage: expect.objectContaining({
              reporter: ['text', 'lcov'],
              reportsDirectory: mockReportsDir('test-package', 'unit'),
              exclude: DEFAULT_EXCLUDES,
            }),
          }),
        }),
      );
      expect(defineConfig).toHaveBeenCalledWith(config);
      expect(defineConfig).toHaveBeenCalledTimes(1);
    });

    it('should create a basic unit test config with URL projectRoot', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_URL,
      };

      const config = createVitestConfig(options);

      expect(config).toEqual(
        expect.objectContaining({
          cacheDir: mockCacheDir('test-package'),
          test: expect.objectContaining({
            include: EXPECTED_INCLUDES.unit,
            globalSetup: [mockGlobalSetup()],
          }),
        }),
      );
    });

    it('should handle projectRoot string without trailing slash', () => {
      const projectRoot = '/Users/test/project';
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot,
      };

      const config = createVitestConfig(options);

      expect((config as any).test.alias).toBeDefined();
    });

    it('should handle projectRoot string with trailing slash', () => {
      const projectRoot = '/Users/test/project/';
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot,
      };

      const config = createVitestConfig(options);

      expect((config as any).test.alias).toBeDefined();
    });
  });

  describe('test kind variations', () => {
    it('should create integration test config', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'int',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const config = createVitestConfig(options);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            include: EXPECTED_INCLUDES.int,
            globalSetup: [mockGlobalSetup()],
            coverage: expect.objectContaining({
              reportsDirectory: mockReportsDir('test-package', 'int'),
            }),
          }),
        }),
      );
    });

    it('should create e2e test config without coverage by default', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'e2e',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const config = createVitestConfig(options);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            include: EXPECTED_INCLUDES.e2e,
            globalSetup: undefined,
          }),
        }),
      );

      expect((config as any).test.coverage).toBeUndefined();
    });

    it('should create e2e test config with coverage when explicitly enabled', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'e2e',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          coverage: {
            enabled: true,
          },
        },
      };

      const config = createVitestConfig(options, overrides);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            include: EXPECTED_INCLUDES.e2e,
            globalSetup: undefined,
            coverage: expect.objectContaining({
              reporter: ['text', 'lcov'],
              reportsDirectory: mockReportsDir('test-package', 'e2e'),
              exclude: DEFAULT_EXCLUDES,
            }),
          }),
        }),
      );
    });
  });

  describe('cacheKey option', () => {
    it('should use cacheKey when provided', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
        cacheKey: 'custom-cache-key',
      };

      const config = createVitestConfig(options);

      expect(config).toEqual(
        expect.objectContaining({
          cacheDir: mockCacheDir('custom-cache-key'),
        }),
      );
    });

    it('should fallback to projectKey when cacheKey is not provided', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const config = createVitestConfig(options);

      expect(config).toEqual(
        expect.objectContaining({
          cacheDir: mockCacheDir('test-package'),
        }),
      );
    });
  });

  describe('setupFiles handling', () => {
    it('should handle setupFiles as string in overrides', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          setupFiles: 'setup.ts',
        },
      };

      const config = createVitestConfig(options, overrides);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            setupFiles: [mockSetupFile('setup.ts')],
          }),
        }),
      );
    });

    it('should handle setupFiles as array in overrides', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          setupFiles: ['setup1.ts', 'setup2.ts'],
        },
      };

      const config = createVitestConfig(options, overrides);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            setupFiles: [
              mockSetupFile('setup1.ts'),
              mockSetupFile('setup2.ts'),
            ],
          }),
        }),
      );
    });

    it('should filter out falsy values from setupFiles', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          setupFiles: ['setup1.ts', '', 'setup2.ts', null as any, 'setup3.ts'],
        },
      };

      const config = createVitestConfig(options, overrides);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            setupFiles: [
              mockSetupFile('setup1.ts'),
              mockSetupFile('setup2.ts'),
              mockSetupFile('setup3.ts'),
            ],
          }),
        }),
      );
    });

    it('should handle empty setupFiles array', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          setupFiles: [],
        },
      };

      const config = createVitestConfig(options, overrides);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            setupFiles: [],
          }),
        }),
      );
    });

    it('should use empty setupFiles when not provided in overrides', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const config = createVitestConfig(options, {});

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            setupFiles: [],
          }),
        }),
      );
    });
  });

  describe('coverage configuration', () => {
    it('should apply custom coverage exclude paths', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          coverage: {
            exclude: ['custom/**', 'ignore/**'],
          },
        },
      };

      const config = createVitestConfig(options, overrides);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            coverage: expect.objectContaining({
              reporter: ['text', 'lcov'],
              reportsDirectory: mockReportsDir('test-package', 'unit'),
              exclude: [...DEFAULT_EXCLUDES, 'custom/**', 'ignore/**'],
            }),
          }),
        }),
      );
    });

    it('should use default exclude when no custom excludes provided', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          coverage: {
            exclude: [],
          },
        },
      };

      const config = createVitestConfig(options, overrides);

      expect(config).toEqual(
        expect.objectContaining({
          test: expect.objectContaining({
            coverage: expect.objectContaining({
              reporter: ['text', 'lcov'],
              reportsDirectory: mockReportsDir('test-package', 'unit'),
              exclude: DEFAULT_EXCLUDES,
            }),
          }),
        }),
      );
    });

    it('should disable coverage when explicitly disabled', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          coverage: {
            enabled: false,
          },
        },
      };

      const config = createVitestConfig(options, overrides);

      expect((config as any).test.coverage).toStrictEqual({});
      expect(config).toBeDefined();
    });

    it('should sanitize coverage options by removing enabled and exclude from overrides', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          coverage: {
            enabled: true,
            exclude: ['custom/**'],
            reporter: ['html', 'json'],
            thresholds: {
              global: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80,
              },
            },
          },
        },
      };

      const config = createVitestConfig(options, overrides);
      expectCoverageConfig(config, {
        reporter: ['text', 'lcov', 'html', 'json'],
        reportsDirectory: mockReportsDir('test-package', 'unit'),
        exclude: [...DEFAULT_EXCLUDES, 'custom/**'],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      });

      expect(config).toBeDefined();
    });
  });

  describe('config merging and sanitization', () => {
    it('should merge base config with overrides', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          testTimeout: TEST_TIMEOUTS.MEDIUM,
          pool: 'forks' as any,
        },
      };

      const config = createVitestConfig(options, overrides);

      const testConfig = (config as any).test;
      expect(testConfig.testTimeout).toBe(TEST_TIMEOUTS.MEDIUM);
      expect(testConfig.pool).toBe('forks');
    });

    it('should sanitize overrides by removing setupFiles from test config', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          setupFiles: ['should-be-removed.ts'],
          testTimeout: TEST_TIMEOUTS.SHORT,
          pool: 'forks' as any,
        },
      };

      const config = createVitestConfig(options, overrides);

      const testConfig = (config as any).test;
      expect(testConfig.setupFiles).toEqual([
        mockSetupFile('should-be-removed.ts'),
      ]);
      expect(testConfig.testTimeout).toBe(TEST_TIMEOUTS.SHORT);
      expect(testConfig.pool).toBe('forks');
    });

    it('should handle overrides without test config', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        build: {
          target: 'node14',
        },
      };

      const config = createVitestConfig(options, overrides);

      expect((config as any).build.target).toBe('node14');
    });

    it('should handle coverage options as undefined', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          coverage: undefined,
          testTimeout: TEST_TIMEOUTS.SHORT,
        },
      };

      const config = createVitestConfig(options, overrides);

      expect((config as any).test.testTimeout).toBe(TEST_TIMEOUTS.SHORT);
      expectCoverageConfig(config, {
        reporter: ['text', 'lcov'],
        reportsDirectory: mockReportsDir('test-package', 'unit'),
        exclude: DEFAULT_EXCLUDES,
      });
    });

    it('should handle coverage options as null', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'unit',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
      };

      const overrides: VitestOverrides = {
        test: {
          coverage: null as any,
          testTimeout: TEST_TIMEOUTS.SHORT,
        },
      };

      const config = createVitestConfig(options, overrides);

      expect((config as any).test.testTimeout).toBe(TEST_TIMEOUTS.SHORT);
      expectCoverageConfig(config, {
        reporter: ['text', 'lcov'],
        reportsDirectory: mockReportsDir('test-package', 'unit'),
        exclude: DEFAULT_EXCLUDES,
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle all test kinds correctly', () => {
      const testKinds: TestKind[] = ['unit', 'int', 'e2e'];

      testKinds.forEach(kind => {
        const options: VitestConfigFactoryOptions = {
          projectKey: 'test-package',
          kind,
          projectRoot: MOCK_PROJECT_ROOT_STRING,
        };

        const config = createVitestConfig(options);

        const expectedIncludes = {
          unit: ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          int: ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          e2e: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        };

        expect((config as any).test.include).toStrictEqual(
          expectedIncludes[kind],
        );
        expect((config as any).test.globalSetup).toStrictEqual(
          kind === 'e2e' ? undefined : [mockGlobalSetup()],
        );
      });
    });

    it('should handle complex override scenarios', () => {
      const options: VitestConfigFactoryOptions = {
        projectKey: 'test-package',
        kind: 'int',
        projectRoot: MOCK_PROJECT_ROOT_STRING,
        cacheKey: 'complex-scenario',
      };

      const overrides: VitestOverrides = {
        test: {
          setupFiles: ['setup1.ts', 'setup2.ts'],
          coverage: {
            enabled: true,
            exclude: ['e2e/**', 'dist/**'],
            reporter: ['lcov', 'text-summary'],
            thresholds: {
              global: {
                statements: 90,
                branches: 85,
                functions: 90,
                lines: 90,
              },
            },
          },
          testTimeout: TEST_TIMEOUTS.LONG,
          environment: 'jsdom' as any,
        },
        build: {
          target: 'es2020',
        },
      };

      const config = createVitestConfig(options, overrides);

      expect(config).toEqual(
        expect.objectContaining({
          cacheDir: `${MOCK_PROJECT_ROOT_STRING}/node_modules/.vite/complex-scenario`,
          build: {
            target: 'es2020',
          },
          test: expect.objectContaining({
            setupFiles: [
              mockSetupFile('setup1.ts'),
              mockSetupFile('setup2.ts'),
            ],
            testTimeout: TEST_TIMEOUTS.LONG,
            environment: 'jsdom',
            include: EXPECTED_INCLUDES.int,
            coverage: expect.objectContaining({
              exclude: ['mocks/**', '**/types.ts', 'e2e/**', 'dist/**'],
              reportsDirectory: mockReportsDir('test-package', 'int'),
            }),
          }),
        }),
      );
    });
  });
});
