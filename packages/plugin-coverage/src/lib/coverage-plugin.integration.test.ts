import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CoveragePluginConfig } from './config';
import { coveragePlugin } from './coverage-plugin';

describe('coveragePlugin', () => {
  const LCOV_PATH = join(
    'packages',
    'plugin-coverage',
    'mocks',
    'single-record-lcov.info',
  );

  it('should initialise a Code coverage plugin', () => {
    expect(
      coveragePlugin({
        coverageTypes: ['function'],
        reports: [{ resultsPath: LCOV_PATH }],
      }),
    ).toStrictEqual(
      expect.objectContaining({
        slug: 'coverage',
        title: 'Code coverage',
        audits: expect.any(Array),
      }),
    );
  });

  it('should generate audits from coverage types', () => {
    expect(
      coveragePlugin({
        coverageTypes: ['function', 'branch'],
        reports: [{ resultsPath: LCOV_PATH }],
      }),
    ).toStrictEqual(
      expect.objectContaining({
        audits: [
          {
            slug: 'function-coverage',
            title: 'Function coverage',
            description: expect.stringContaining('Function coverage'),
          },
          expect.objectContaining({ slug: 'branch-coverage' }),
        ],
      }),
    );
  });

  it('should assign RunnerConfig when a command is passed', () => {
    expect(
      coveragePlugin({
        coverageTypes: ['line'],
        reports: [{ resultsPath: LCOV_PATH }],
        coverageToolCommand: {
          command: 'npm run-many',
          args: ['-t', 'test', '--coverage'],
        },
      } satisfies CoveragePluginConfig),
    ).toStrictEqual(
      expect.objectContaining({
        slug: 'coverage',
        runner: {
          command: 'npm run-many',
          args: ['-t', 'test', '--coverage'],
          outputFile: expect.stringContaining('runner-output.json'),
          outputTransform: expect.any(Function),
        },
      }),
    );
  });

  it('should assign a RunnerFunction when only reports are passed', () => {
    expect(
      coveragePlugin({
        coverageTypes: ['line'],
        reports: [{ resultsPath: LCOV_PATH }],
      } satisfies CoveragePluginConfig),
    ).toStrictEqual(
      expect.objectContaining({
        slug: 'coverage',
        runner: expect.any(Function),
      }),
    );
  });
});
