import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RunnerConfig } from '@code-pushup/models';
import { stylelintPlugin } from './stylelint-plugin';

vi.mock('./runner/index.ts', () => ({
  createRunnerConfig: vi.fn().mockReturnValue({
    command: 'node',
    outputFile: 'runner-output.json',
  } satisfies RunnerConfig),
}));

describe('stylelintPlugin', () => {
  const LCOV_PATH = path.join(
    'packages',
    'plugin-stylelint',
    'mocks',
    'single-record-lcov.info',
  );

  it('should initialise a Code stylelint plugin', async () => {
    await expect(
      stylelintPlugin({
        stylelintTypes: ['function'],
        reports: [LCOV_PATH],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        slug: 'stylelint',
        title: 'Code stylelint',
        audits: expect.any(Array),
        groups: expect.any(Array),
        runner: expect.any(Object),
      }),
    );
  });

  it('should generate audits from stylelint types', async () => {
    await expect(
      stylelintPlugin({
        stylelintTypes: ['function', 'branch'],
        reports: [LCOV_PATH],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [
          {
            slug: 'function-stylelint',
            title: 'Function stylelint',
            description: expect.stringContaining(
              'how many functions were called',
            ),
          },
          expect.objectContaining({ slug: 'branch-stylelint' }),
        ],
      }),
    );
  });

  it('should provide a group from defined stylelint types', async () => {
    await expect(
      stylelintPlugin({
        stylelintTypes: ['branch', 'line'],
        reports: [{ resultsPath: LCOV_PATH }],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [
          expect.objectContaining({ slug: 'branch-stylelint' }),
          expect.objectContaining({ slug: 'line-stylelint' }),
        ],
        groups: [
          expect.objectContaining({
            slug: 'stylelint',
            refs: [
              expect.objectContaining({ slug: 'branch-stylelint' }),
              expect.objectContaining({ slug: 'line-stylelint' }),
            ],
          }),
        ],
      }),
    );
  });
});
