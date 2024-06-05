import { vol } from 'memfs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { CoverageResult } from '../config';
import {
  JestCoverageConfig,
  VitestCoverageConfig,
  getCoveragePathForJest,
  getCoveragePathForVitest,
  getCoveragePathsForTarget,
} from './coverage-paths';

vi.mock('bundle-require', () => ({
  bundleRequire: vi.fn().mockImplementation((options: { filepath: string }) => {
    const VITEST_VALID: VitestCoverageConfig = {
      test: {
        coverage: {
          reporter: ['lcov'],
          reportsDirectory: join('coverage', 'cli'),
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
      coverageDirectory: join('coverage', 'core'),
    };

    const JEST_NO_DIR: JestCoverageConfig = {
      coverageReporters: ['lcov'],
    };

    const JEST_NO_LCOV: JestCoverageConfig = {
      coverageReporters: ['json'],
      coverageDirectory: 'coverage',
    };

    const wrapReturnValue = (
      value: VitestCoverageConfig | JestCoverageConfig,
    ) => ({ mod: { default: value } });

    const config = options.filepath.split('.')[0];
    switch (config) {
      case 'vitest-valid':
        return wrapReturnValue(VITEST_VALID);
      case 'vitest-no-lcov':
        return wrapReturnValue(VITEST_NO_LCOV);
      case 'vitest-no-dir':
        return wrapReturnValue(VITEST_NO_DIR);
      case 'jest-valid':
        return wrapReturnValue(JEST_VALID);
      case 'jest-no-lcov':
        return wrapReturnValue(JEST_NO_LCOV);
      case 'jest-no-dir':
        return wrapReturnValue(JEST_NO_DIR);
      default:
        return wrapReturnValue({});
    }
  }),
}));

describe('getCoveragePathForTarget', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        // values come from bundle-require mock above
        'vitest-valid.config.unit.ts': '',
        'jest-valid.config.unit.ts': '',
      },
      MEMFS_VOLUME,
    );
  });

  it('should fetch Vitest coverage paths', async () => {
    await expect(
      getCoveragePathsForTarget(
        {
          executor: '@nx/vite:test',
          options: { config: 'vitest-valid.config.unit.ts' },
        },
        join('packages', 'cli'),
        'unit-test in cli',
      ),
    ).resolves.toEqual({
      pathToProject: join('packages', 'cli'),
      resultsPath: join('packages', 'cli', 'coverage', 'cli', 'lcov.info'),
    });
  });

  it('should fetch Jest coverage paths', async () => {
    await expect(
      getCoveragePathsForTarget(
        {
          executor: '@nx/jest:jest',
          options: { config: 'jest-valid.config.unit.ts' },
        },
        join('packages', 'core'),
        'unit-test in core',
      ),
    ).resolves.toBe(join('packages', 'core', 'coverage', 'core', 'lcov.info'));
  });

  it('should throw for unsupported executor (only vitest and jest are supported)', async () => {
    await expect(() =>
      getCoveragePathsForTarget(
        {
          executor: '@nx/cypress',
          options: { config: 'cypress.config.ts' },
        },
        join('apps', 'ui'),
        'component-test in ui',
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

  it('should fetch Vitest reportsDirectory', async () => {
    await expect(
      getCoveragePathForVitest(
        'vitest-valid.config.unit.ts',
        join('packages', 'cli'),
        'unit-test in cli',
      ),
    ).resolves.toEqual({
      pathToProject: join('packages', 'cli'),
      resultsPath: join('packages', 'cli', 'coverage', 'cli', 'lcov.info'),
    } satisfies CoverageResult);
  });

  it('should throw when reportsDirectory is not set in Vitest config', async () => {
    await expect(() =>
      getCoveragePathForVitest(
        'vitest-no-dir.config.integration.ts',
        'packages',
        'integration-test in cli',
      ),
    ).rejects.toThrow(
      /configuration .* does not include coverage path .* Add the path under coverage > reportsDirectory/,
    );
  });

  it('should throw when Vitest config does not include lcov reporter', async () => {
    await expect(() =>
      getCoveragePathForVitest(
        'vitest-no-lcov.config.integration.ts',
        'packages',
        'integration-test in core',
      ),
    ).rejects.toThrow(/configuration .* does not include LCOV report format/);
  });
});

describe('getCoveragePathForJest', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        // values come from bundle-require mock above
        'jest-valid.config.unit.ts': '',
        'jest-no-dir.config.integration.ts': '',
        'jest-no-lcov.config.integration.ts': '',
      },
      MEMFS_VOLUME,
    );
  });

  it('should fetch Jest coverageDirectory', async () => {
    await expect(
      getCoveragePathForJest(
        'jest-valid.config.unit.ts',
        join('packages', 'cli'),
        'unit-test in core',
      ),
    ).resolves.toBe(join('packages', 'cli', 'coverage', 'core', 'lcov.info'));
  });

  it('should throw when reportsDirectory is not set in Jest config', async () => {
    await expect(() =>
      getCoveragePathForJest(
        'jest-no-dir.config.integration.ts',
        'packages',
        'integration-test in core',
      ),
    ).rejects.toThrow(
      /configuration .* does not include coverage path .* Add the path under coverageDirectory/,
    );
  });

  it('should throw when Jest config does not include lcov reporter', async () => {
    await expect(() =>
      getCoveragePathForJest(
        'jest-no-lcov.config.integration.ts',
        'packages',
        'integration-test in core',
      ),
    ).rejects.toThrow(/configuration .* does not include LCOV report format/);
  });
});
