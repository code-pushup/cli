import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineConfig } from 'vitest/config';
import type { E2ETestOptions, TestKind } from './vitest-config-factory.js';
import { createVitestConfig } from './vitest-config-factory.js';

vi.mock('vitest/config', async importOriginal => {
  const actual = await importOriginal<typeof import('vitest/config')>();
  return {
    ...actual,
    defineConfig: vi.fn(config => config),
  };
});

vi.mock('./vitest-tsconfig-path-aliases.js', () => ({
  tsconfigPathAliases: vi
    .fn()
    .mockReturnValue([{ find: '@test/alias', replacement: '/mock/path' }]),
}));

describe('createVitestConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unit test configuration', () => {
    it('should create a complete unit test config with all defaults', () => {
      const config = createVitestConfig('test-package', 'unit');

      expect(config).toEqual(
        expect.objectContaining({
          cacheDir: '../../node_modules/.vite/test-package',
          test: expect.objectContaining({
            reporters: ['basic'],
            globals: true,
            cache: { dir: '../../node_modules/.vitest' },
            alias: expect.any(Array),
            pool: 'threads',
            poolOptions: { threads: { singleThread: true } },
            environment: 'node',
            include: [
              'src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
              'src/**/*.type.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ],
            globalSetup: ['../../global-setup.ts'],
            setupFiles: expect.arrayContaining([
              '../../testing/test-setup/src/lib/console.mock.ts',
              '../../testing/test-setup/src/lib/reset.mocks.ts',
              '../../testing/test-setup/src/lib/fs.mock.ts',
            ]),
            coverage: expect.objectContaining({
              reporter: ['text', 'lcov'],
              reportsDirectory: '../../coverage/test-package/unit-tests',
              exclude: ['mocks/**', '**/types.ts', 'perf/**'],
            }),
            typecheck: { include: ['**/*.type.test.ts'] },
          }),
        }),
      );
      expect(defineConfig).toHaveBeenCalledWith(config);
    });

    it('should include all required setup files for unit tests', () => {
      const config = createVitestConfig('test-package', 'unit');

      const setupFiles = (config as any).test.setupFiles;
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/console.mock.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/reset.mocks.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/cliui.mock.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/fs.mock.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/git.mock.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/portal-client.mock.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
      );
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/extend/path.matcher.ts',
      );
    });

    it('should include type test pattern in unit tests', () => {
      const config = createVitestConfig('test-package', 'unit');

      expect((config as any).test.include).toContain(
        'src/**/*.type.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      );
    });

    it('should enable typecheck for unit tests', () => {
      const config = createVitestConfig('test-package', 'unit');

      expect((config as any).test.typecheck).toEqual({
        include: ['**/*.type.test.ts'],
      });
    });

    it('should always include perf/** in coverage exclusions', () => {
      const config = createVitestConfig('test-package', 'unit');

      expect((config as any).test.coverage.exclude).toContain('perf/**');
    });
  });

  describe('integration test configuration', () => {
    it('should create a complete integration test config', () => {
      const config = createVitestConfig('test-package', 'int');

      expect(config).toEqual(
        expect.objectContaining({
          cacheDir: '../../node_modules/.vite/test-package',
          test: expect.objectContaining({
            reporters: ['basic'],
            globals: true,
            include: ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            globalSetup: ['../../global-setup.ts'],
            coverage: expect.objectContaining({
              reportsDirectory: '../../coverage/test-package/int-tests',
            }),
          }),
        }),
      );
    });

    it('should include correct setup files for integration tests', () => {
      const config = createVitestConfig('test-package', 'int');

      const setupFiles = (config as any).test.setupFiles;
      // Should include console mock
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/console.mock.ts',
      );
      // Should NOT include fs, cliui, or git mocks (integration tests need real implementations)
      expect(setupFiles).not.toContain(
        '../../testing/test-setup/src/lib/fs.mock.ts',
      );
      expect(setupFiles).not.toContain(
        '../../testing/test-setup/src/lib/cliui.mock.ts',
      );
      expect(setupFiles).not.toContain(
        '../../testing/test-setup/src/lib/git.mock.ts',
      );
      // Should include all matchers
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/extend/path.matcher.ts',
      );
    });

    it('should not enable typecheck for integration tests', () => {
      const config = createVitestConfig('test-package', 'int');

      expect((config as any).test.typecheck).toBeUndefined();
    });
  });

  describe('e2e test configuration', () => {
    it('should create e2e config without coverage by default', () => {
      const config = createVitestConfig('test-package', 'e2e');

      expect(config).toEqual(
        expect.objectContaining({
          cacheDir: '../../node_modules/.vite/test-package',
          test: expect.objectContaining({
            reporters: ['basic'],
            globals: true,
            include: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            globalSetup: undefined,
          }),
        }),
      );
      expect((config as any).test.coverage).toBeUndefined();
    });

    it('should include minimal setup files for e2e tests', () => {
      const config = createVitestConfig('test-package', 'e2e');

      const setupFiles = (config as any).test.setupFiles;
      // Should only include reset mocks
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/reset.mocks.ts',
      );
      // Should NOT include console, fs, git, etc.
      expect(setupFiles).not.toContain(
        '../../testing/test-setup/src/lib/console.mock.ts',
      );
      expect(setupFiles).not.toContain(
        '../../testing/test-setup/src/lib/fs.mock.ts',
      );
      // Should include all matchers
      expect(setupFiles).toContain(
        '../../testing/test-setup/src/lib/extend/path.matcher.ts',
      );
    });

    it('should support custom testTimeout option', () => {
      const options: E2ETestOptions = { testTimeout: 60_000 };
      const config = createVitestConfig('test-package', 'e2e', options);

      expect((config as any).test.testTimeout).toBe(60_000);
    });

    it('should support multiple options together', () => {
      const options: E2ETestOptions = {
        testTimeout: 30_000,
      };
      const config = createVitestConfig('test-package', 'e2e', options);

      expect((config as any).test.testTimeout).toBe(30_000);
      expect((config as any).test.coverage).toBeUndefined();
    });
  });

  describe('cacheDir naming', () => {
    it('should use projectKey for cacheDir', () => {
      const config = createVitestConfig('my-custom-name', 'unit');

      expect(config.cacheDir).toBe('../../node_modules/.vite/my-custom-name');
    });

    it('should use projectKey for coverage directory', () => {
      const config = createVitestConfig('my-package', 'unit');

      expect((config as any).test.coverage.reportsDirectory).toBe(
        '../../coverage/my-package/unit-tests',
      );
    });
  });

  describe('test kind variations', () => {
    it('should handle all test kinds correctly', () => {
      const testKinds: TestKind[] = ['unit', 'int', 'e2e'];

      testKinds.forEach(kind => {
        const config = createVitestConfig('test-package', kind);

        const expectedIncludes = {
          unit: [
            'src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/**/*.type.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
          ],
          int: ['src/**/*.int.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          e2e: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        };

        expect((config as any).test.include).toStrictEqual(
          expectedIncludes[kind],
        );

        const expectedGlobalSetup = {
          unit: ['../../global-setup.ts'],
          int: ['../../global-setup.ts'],
          e2e: undefined,
        };

        expect((config as any).test.globalSetup).toStrictEqual(
          expectedGlobalSetup[kind],
        );
      });
    });
  });

  describe('coverage configuration', () => {
    it('should enable coverage for unit tests by default', () => {
      const config = createVitestConfig('test-package', 'unit');

      expect((config as any).test.coverage).toBeDefined();
      expect((config as any).test.coverage.reporter).toEqual(['text', 'lcov']);
    });

    it('should enable coverage for integration tests by default', () => {
      const config = createVitestConfig('test-package', 'int');

      expect((config as any).test.coverage).toBeDefined();
    });

    it('should disable coverage for e2e tests by default', () => {
      const config = createVitestConfig('test-package', 'e2e');

      expect((config as any).test.coverage).toBeUndefined();
    });

    it('should always exclude mocks, types.ts, and perf folders', () => {
      const config = createVitestConfig('test-package', 'unit');

      expect((config as any).test.coverage.exclude).toEqual([
        'mocks/**',
        '**/types.ts',
        'perf/**',
      ]);
    });
  });

  describe('relative paths', () => {
    it('should use relative paths for all file references', () => {
      const config = createVitestConfig('test-package', 'unit');

      // Setup files should be relative
      const setupFiles = (config as any).test.setupFiles;
      expect(setupFiles[0]).toMatch(/^\.\.\/\.\.\//);

      // GlobalSetup should be relative
      expect((config as any).test.globalSetup[0]).toBe('../../global-setup.ts');

      // Cache dirs should be relative
      expect(config.cacheDir).toMatch(/^\.\.\/\.\.\//);
      expect((config as any).test.cache.dir).toMatch(/^\.\.\/\.\.\//);

      // Coverage directory should be relative
      expect((config as any).test.coverage.reportsDirectory).toMatch(
        /^\.\.\/\.\.\//,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty projectKey gracefully', () => {
      const config = createVitestConfig('', 'unit');

      expect(config.cacheDir).toBe('../../node_modules/.vite/');
      expect((config as any).test.coverage.reportsDirectory).toBe(
        '../../coverage//unit-tests',
      );
    });

    it('should handle projectKey with special characters', () => {
      const config = createVitestConfig('my-special_package.v2', 'unit');

      expect(config.cacheDir).toBe(
        '../../node_modules/.vite/my-special_package.v2',
      );
    });

    it('should not modify config when no options provided to e2e', () => {
      const config = createVitestConfig('test-package', 'e2e');

      expect((config as any).test.testTimeout).toBeUndefined();
      expect((config as any).test.globalSetup).toBeUndefined();
    });
  });
});
