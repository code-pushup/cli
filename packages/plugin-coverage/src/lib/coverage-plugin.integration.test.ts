import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CoveragePluginConfig } from './config';
import { coveragePlugin } from './coverage-plugin';

describe('coveragePluginConfigSchema', () => {
  it('should initialise a Code coverage plugin', () => {
    expect(
      coveragePlugin({
        coverageType: ['function'],
        reports: [join('packages', 'plugin-coverage', 'mocks', 'lcov.info')],
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
        coverageType: ['function', 'branch'],
        reports: [join('packages', 'plugin-coverage', 'mocks', 'lcov.info')],
      }),
    ).toStrictEqual(
      expect.objectContaining({
        audits: [
          {
            slug: 'function-coverage',
            title: 'function coverage',
            description: 'function coverage percentage on the project',
          },
          expect.objectContaining({ slug: 'branch-coverage' }),
        ],
      }),
    );
  });

  it('should assign RunnerConfig when a command is passed', () => {
    expect(
      coveragePlugin({
        coverageType: ['line'],
        reports: [join('packages', 'plugin-coverage', 'mocks', 'lcov.info')],
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
        coverageType: ['line'],
        reports: [join('packages', 'plugin-coverage', 'mocks', 'lcov.info')],
      } satisfies CoveragePluginConfig),
    ).toStrictEqual(
      expect.objectContaining({
        slug: 'coverage',
        runner: expect.any(Function),
      }),
    );
  });
});
