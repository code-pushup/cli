import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RunnerConfig } from '@code-pushup/models';
import { coveragePlugin } from './coverage-plugin.js';

vi.mock('./runner/index.ts', () => ({
  createRunnerConfig: vi.fn().mockReturnValue({
    command: 'node',
    outputFile: 'runner-output.json',
  } satisfies RunnerConfig),
}));

describe('coveragePlugin', () => {
  const LCOV_PATH = path.join(
    'packages',
    'plugin-coverage',
    'mocks',
    'single-record-lcov.info',
  );

  it('should initialise a Code coverage plugin', async () => {
    await expect(
      coveragePlugin({
        coverageTypes: ['function'],
        reports: [LCOV_PATH],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        slug: 'coverage',
        title: 'Code coverage',
        audits: expect.any(Array),
        groups: expect.any(Array),
        runner: expect.any(Object),
      }),
    );
  });

  it('should generate audits from coverage types', async () => {
    await expect(
      coveragePlugin({
        coverageTypes: ['function', 'branch'],
        reports: [LCOV_PATH],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [
          {
            slug: 'function-coverage',
            title: 'Function coverage',
            description: expect.stringContaining(
              'how many functions were called',
            ),
          },
          expect.objectContaining({ slug: 'branch-coverage' }),
        ],
      }),
    );
  });

  it('should provide a group from defined coverage types', async () => {
    await expect(
      coveragePlugin({
        coverageTypes: ['branch', 'line'],
        reports: [{ resultsPath: LCOV_PATH }],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [
          expect.objectContaining({ slug: 'branch-coverage' }),
          expect.objectContaining({ slug: 'line-coverage' }),
        ],
        groups: [
          expect.objectContaining({
            slug: 'coverage',
            refs: [
              expect.objectContaining({ slug: 'branch-coverage' }),
              expect.objectContaining({ slug: 'line-coverage' }),
            ],
          }),
        ],
      }),
    );
  });
});
