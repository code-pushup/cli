import { vol } from 'memfs';
import { describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  JestCoverageConfig,
  VitestCoverageConfig,
  getCoveragePathForTarget,
} from './coverage-paths';

vi.mock('bundle-require', () => ({
  bundleRequire: vi.fn().mockImplementation((options: { filepath: string }) => {
    const config = options.filepath.split('.')[0];
    const VITEST_VALID: VitestCoverageConfig = {
      test: {
        coverage: { reporter: ['lcov'], reportsDirectory: 'coverage/cli' },
      },
    };

    const VITEST_NO_DIR: VitestCoverageConfig = {
      test: { coverage: { reporter: ['lcov'] } },
    };

    const JEST_VALID: JestCoverageConfig = {
      coverageReporters: ['lcov'],
      coverageDirectory: 'coverage/core',
    };

    const JEST_NO_DIR: JestCoverageConfig = {
      coverageReporters: ['lcov'],
    };

    const JEST_NO_LCOV: JestCoverageConfig = {
      coverageReporters: ['json'],
      coverageDirectory: 'coverage/utils',
    };

    return {
      mod: {
        default:
          config === 'vitest-valid'
            ? VITEST_VALID
            : config === 'jest-valid'
            ? JEST_VALID
            : config === 'vitest-no-dir'
            ? VITEST_NO_DIR
            : config === 'jest-no-dir'
            ? JEST_NO_DIR
            : JEST_NO_LCOV,
      },
    };
  }),
}));

describe('getCoveragePathForTarget', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        // values come from bundle-require mock above
        'vitest-valid.config.unit.ts': '',
        'jest-valid.config.unit.ts': '',
        'vitest-no-dir.config.integration.ts': '',
        'jest-no-dir.config.integration.ts': '',
        'jest-no-lcov.config.integration.ts': '',
      },
      MEMFS_VOLUME,
    );
  });

  it('should fetch Vitest reportsDirectory', async () => {
    await expect(
      getCoveragePathForTarget(
        'unit-test',
        {
          executor: '@nx/vite:test',
          options: { config: 'vitest-valid.config.unit.ts' },
        },
        'cli',
      ),
    ).resolves.toBe('coverage/cli');
  });

  it('should fetch Jest coverageDirectory', async () => {
    await expect(
      getCoveragePathForTarget(
        'unit-test',
        {
          executor: '@nx/jest:jest',
          options: { config: 'jest-valid.config.unit.ts' },
        },
        'core',
      ),
    ).resolves.toBe('coverage/core');
  });

  it('should throw when reportsDirectory is not set in vitest config', async () => {
    await expect(() =>
      getCoveragePathForTarget(
        'integration-test',
        {
          executor: '@nx/vite:test',
          options: { config: 'vitest-no-dir.config.integration.ts' },
        },
        'cli',
      ),
    ).rejects.toThrow(
      /configuration .* does not include coverage path .* Add the path under coverage > reportsDirectory/,
    );
  });

  it('should throw when reportsDirectory is not set in jest config', async () => {
    await expect(() =>
      getCoveragePathForTarget(
        'integration-test',
        {
          executor: '@nx/jest:jest',
          options: { config: 'jest-no-dir.config.integration.ts' },
        },
        'core',
      ),
    ).rejects.toThrow(
      /configuration .* does not include coverage path .* Add the path under coverageDirectory/,
    );
  });

  it('should throw when config does not include lcov reporter', async () => {
    await expect(() =>
      getCoveragePathForTarget(
        'integration-test',
        {
          executor: '@nx/jest:jest',
          options: { config: 'jest-no-lcov.config.integration.ts' },
        },
        'core',
      ),
    ).rejects.toThrow(/configuration .* does not include LCOV report format/);
  });

  it('should throw for unsupported executor (only vitest and jest are supported)', async () => {
    await expect(() =>
      getCoveragePathForTarget(
        'component-test',
        {
          executor: '@nx/cypress',
          options: { config: 'cypress.config.ts' },
        },
        'ui',
      ),
    ).rejects.toThrow('Unsupported executor @nx/cypress.');
  });
});
