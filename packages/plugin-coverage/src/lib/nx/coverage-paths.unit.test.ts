import type { JestExecutorOptions } from '@nx/jest/src/executors/jest/schema';
import type { VitestExecutorOptions } from '@nx/vite/executors';
import { vol } from 'memfs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import type { CoverageResult } from '../config.js';
import {
  type JestCoverageConfig,
  type VitestCoverageConfig,
  getCoveragePathForJest,
  getCoveragePathForVitest,
  getCoveragePathsForTarget,
} from './coverage-paths.js';

vi.mock('@code-pushup/utils', async () => {
  const actualUtils = await vi.importActual('@code-pushup/utils');

  return {
    ...actualUtils,
    importModule: vi
      .fn()
      .mockImplementation((options: { filepath: string }) => {
        const VITEST_VALID: VitestCoverageConfig = {
          test: {
            coverage: {
              reporter: ['lcov'],
              reportsDirectory: path.join('coverage', 'cli'),
            },
          },
        };

        const VITEST_NO_DIR: VitestCoverageConfig = {
          test: { coverage: { reporter: ['lcov'] } },
        };

        const VITEST_NO_LCOV: VitestCoverageConfig = {
          test: {
            coverage: {
              reporter: ['json'],
              reportsDirectory: 'coverage',
            },
          },
        };

        const JEST_VALID: JestCoverageConfig = {
          coverageReporters: ['lcov'],
          coverageDirectory: path.join('coverage', 'core'),
        };

        const JEST_NO_DIR: JestCoverageConfig = {
          coverageReporters: ['lcov'],
        };

        const JEST_NO_LCOV: JestCoverageConfig = {
          coverageReporters: ['json'],
          coverageDirectory: 'coverage',
        };

        const JEST_PRESET: JestCoverageConfig & { preset?: string } = {
          preset: '../../jest.preset.ts',
          coverageDirectory: 'coverage',
        };

        const config = options.filepath.split('.')[0];
        switch (config) {
          case 'vitest-valid':
            return VITEST_VALID;
          case 'vitest-no-lcov':
            return VITEST_NO_LCOV;
          case 'vitest-no-dir':
            return VITEST_NO_DIR;
          case 'jest-valid':
            return JEST_VALID;
          case 'jest-no-lcov':
            return JEST_NO_LCOV;
          case 'jest-no-dir':
            return JEST_NO_DIR;
          case 'jest-preset':
            return JEST_PRESET;
          default:
            return {};
        }
      }),
  };
});

describe('getCoveragePathForTarget', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        // values come from bundle-require mock above
        'vitest-valid.config.ts': '',
        'jest-valid.config.ts': '',
      },
      MEMFS_VOLUME,
    );
  });

  it('should fetch Vitest coverage paths', async () => {
    await expect(
      getCoveragePathsForTarget(
        {
          name: 'cli',
          root: path.join('packages', 'cli'),
          targets: {
            test: {
              executor: '@nx/vite:test',
              options: {
                configFile: 'vitest-valid.config.ts',
              } satisfies VitestExecutorOptions,
            },
          },
        },
        'test',
      ),
    ).resolves.toEqual({
      pathToProject: path.join('packages', 'cli'),
      resultsPath: path.join('packages', 'cli', 'coverage', 'cli', 'lcov.info'),
    });
  });

  it('should fetch Jest coverage paths', async () => {
    await expect(
      getCoveragePathsForTarget(
        {
          name: 'core',
          root: path.join('packages', 'core'),
          targets: {
            test: {
              executor: '@nx/jest:jest',
              options: {
                jestConfig: 'jest-valid.config.ts',
              } satisfies JestExecutorOptions,
            },
          },
        },
        'test',
      ),
    ).resolves.toBe(
      path.join('packages', 'core', 'coverage', 'core', 'lcov.info'),
    );
  });

  it('should throw for unsupported executor (only vitest and jest are supported)', async () => {
    await expect(() =>
      getCoveragePathsForTarget(
        {
          name: 'ui',
          root: path.join('apps', 'ui'),
          targets: {
            'component-test': {
              executor: '@nx/cypress',
              options: { cypressConfig: 'cypress.config.ts' },
            },
          },
        },
        'component-test',
      ),
    ).rejects.toThrow('Unsupported executor @nx/cypress.');
  });
});

describe('getCoveragePathForVitest', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        // values come from bundle-require mock above
        'vitest-valid.config.unit.ts': '',
        'vitest-no-dir.config.integration.ts': '',
        'vitest-no-lcov.config.integration.ts': '',
      },
      MEMFS_VOLUME,
    );
  });

  it('should fetch Vitest reportsDirectory from vite config', async () => {
    await expect(
      getCoveragePathForVitest(
        { configFile: 'vitest-valid.config.unit.ts' },
        { name: 'cli', root: path.join('packages', 'cli') },
        'unit-test',
      ),
    ).resolves.toEqual({
      pathToProject: path.join('packages', 'cli'),
      resultsPath: path.join('packages', 'cli', 'coverage', 'cli', 'lcov.info'),
    } satisfies CoverageResult);
  });

  it('should throw when reportsDirectory is not set in Vitest config', async () => {
    await expect(() =>
      getCoveragePathForVitest(
        { configFile: 'vitest-no-dir.config.integration.ts' },
        { name: 'cli', root: path.join('packages', 'cli') },
        'integration-test',
      ),
    ).rejects.toThrow(
      /configuration .* does not include coverage path .* Add the path under coverage > reportsDirectory/,
    );
  });

  it('should override vitest config reportsDirectory from project.json', async () => {
    await expect(
      getCoveragePathForVitest(
        {
          configFile: 'vitest-valid.config.unit.ts',
          reportsDirectory: path.join(
            '..',
            '..',
            'dist',
            'packages',
            'cli',
            'coverage',
          ),
        },
        { name: 'cli', root: path.join('packages', 'cli') },
        'unit-test',
      ),
    ).resolves.toEqual({
      pathToProject: path.join('packages', 'cli'),
      resultsPath: path.join(
        'dist',
        'packages',
        'cli',
        'coverage',
        'lcov.info',
      ),
    } satisfies CoverageResult);
  });

  it('should throw when Vitest config does not include lcov reporter', async () => {
    await expect(() =>
      getCoveragePathForVitest(
        { configFile: 'vitest-no-lcov.config.integration.ts' },
        { name: 'core', root: path.join('packages', 'core') },
        'integration-test',
      ),
    ).rejects.toThrow(/configuration .* does not include LCOV report format/);
  });

  it('should handle absolute path in reportsDirectory', async () => {
    await expect(
      getCoveragePathForVitest(
        {
          configFile: 'vitest-valid.config.unit.ts',
          reportsDirectory: path.join(
            process.cwd(),
            'coverage',
            'packages',
            'cli',
          ),
        },
        { name: 'cli', root: path.join('packages', 'cli') },
        'unit-test',
      ),
    ).resolves.toBe(
      path.join(process.cwd(), 'coverage', 'packages', 'cli', 'lcov.info'),
    );
  });
});

describe('getCoveragePathForJest', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        // values come from bundle-require mock above
        'jest-preset.config.ts': '',
        'jest-valid.config.unit.ts': '',
        'jest-valid.config.integration.ts': '',
        'jest-no-dir.config.integration.ts': '',
        'jest-no-lcov.config.integration.ts': '',
      },
      MEMFS_VOLUME,
    );
  });

  it('should fetch Jest coverageDirectory', async () => {
    await expect(
      getCoveragePathForJest(
        { jestConfig: 'jest-valid.config.unit.ts' },
        { name: 'cli', root: path.join('packages', 'cli') },
        'unit-test',
      ),
    ).resolves.toBe(
      path.join('packages', 'cli', 'coverage', 'core', 'lcov.info'),
    );
  });

  it('should throw when coverageDirectory is not set in Jest config', async () => {
    await expect(() =>
      getCoveragePathForJest(
        { jestConfig: 'jest-no-dir.config.integration.ts' },
        { name: 'core', root: path.join('packages', 'core') },
        'integration-test',
      ),
    ).rejects.toThrow(
      /configuration .* does not include coverage path .* Add the path under coverageDirectory/,
    );
  });

  it('should override jest config coverageDirectory from project.json', async () => {
    await expect(
      getCoveragePathForJest(
        {
          jestConfig: 'jest-valid.config.unit.ts',
          coverageDirectory: path.join(
            '..',
            '..',
            'dist',
            'packages',
            'cli',
            'coverage',
          ),
        },
        { name: 'cli', root: path.join('packages', 'cli') },
        'unit-test',
      ),
    ).resolves.toBe(
      path.join('dist', 'packages', 'cli', 'coverage', 'lcov.info'),
    );
  });

  it('should throw when Jest config does not include lcov reporter', async () => {
    await expect(() =>
      getCoveragePathForJest(
        { jestConfig: 'jest-no-lcov.config.integration.ts' },
        { name: 'core', root: path.join('packages', 'core') },
        'integration-test',
      ),
    ).rejects.toThrow(/configuration .* does not include LCOV report format/);
  });

  it('should not throw if lcov reporter in project.json instead of jest config', async () => {
    await expect(
      getCoveragePathForJest(
        {
          jestConfig: 'jest-no-lcov.config.integration.ts',
          coverageReporters: ['lcov'],
        },
        { name: 'core', root: path.join('packages', 'core') },
        'integration-test',
      ),
    ).resolves.toBeTypeOf('string');
  });

  it('should throw if lcov reporter from jest config overridden in project.json', async () => {
    await expect(
      getCoveragePathForJest(
        {
          jestConfig: 'jest-valid.config.integration.ts',
          coverageReporters: ['text', 'html'],
        },
        { name: 'core', root: path.join('packages', 'core') },
        'integration-test',
      ),
    ).rejects.toThrow(/configuration .* does not include LCOV report format/);
  });

  it('should not throw if lcov reporter in both project.json and jest config', async () => {
    await expect(
      getCoveragePathForJest(
        {
          jestConfig: 'jest-valid.config.integration.ts',
          coverageReporters: ['lcov'],
        },
        { name: 'core', root: path.join('packages', 'core') },
        'integration-test',
      ),
    ).resolves.toBeTypeOf('string');
  });

  it('should not throw regarding missing lcov reporter if jest config uses preset', async () => {
    await expect(
      getCoveragePathForJest(
        { jestConfig: 'jest-preset.config.ts' },
        { name: 'core', root: path.join('packages', 'core') },
        'test',
      ),
    ).resolves.toBeTypeOf('string');
  });

  it('should handle absolute path in coverageDirectory', async () => {
    await expect(
      getCoveragePathForJest(
        {
          jestConfig: 'jest-valid.config.unit.ts',
          coverageDirectory: path.join(
            process.cwd(),
            'coverage',
            'packages',
            'cli',
          ),
        },
        { name: 'cli', root: path.join('packages', 'cli') },
        'unit-test',
      ),
    ).resolves.toBe(
      path.join(process.cwd(), 'coverage', 'packages', 'cli', 'lcov.info'),
    );
  });
});
