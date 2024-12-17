import { describe, expect, it } from 'vitest';
import type { RunnerConfig } from '@code-pushup/models';
import { docCoveragePlugin } from './doc-coverage-plugin.js';

vi.mock('./runner/index.ts', () => ({
  createRunnerConfig: vi.fn().mockReturnValue({
    command: 'node',
    outputFile: 'runner-output.json',
  } satisfies RunnerConfig),
}));

describe('docCoveragePlugin', () => {
  it('should initialise a Documentation coverage plugin', async () => {
    await expect(
      docCoveragePlugin({
        outputPath: 'documentation/documentation.json',
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        slug: 'doc-coverage',
        title: 'Documentation coverage',
        audits: expect.any(Array),
        groups: expect.any(Array),
        runner: expect.any(Object),
      }),
    );
  });

  it('should generate percentage coverage audit', async () => {
    await expect(
      docCoveragePlugin({
        outputPath: 'documentation/documentation.json',
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [
          {
            slug: 'percentage-coverage',
            title: 'Percentage of codebase with documentation',
            description: expect.stringContaining(
              'how many % of the codebase have documentation',
            ),
          },
        ],
      }),
    );
  });

  it('should provide a documentation coverage group', async () => {
    await expect(
      docCoveragePlugin({
        outputPath: 'documentation/documentation.json',
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        groups: [
          expect.objectContaining({
            slug: 'doc-coverage',
            title: 'Documentation coverage metrics',
            refs: [
              expect.objectContaining({
                slug: 'percentage-coverage',
                weight: 1,
              }),
            ],
          }),
        ],
      }),
    );
  });

  it('should include package metadata', async () => {
    await expect(
      docCoveragePlugin({
        outputPath: 'documentation/documentation.json',
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        icon: 'folder-src',
        description: expect.stringContaining('documentation coverage plugin'),
        docsUrl: expect.stringContaining('npmjs.com'),
        packageName: expect.any(String),
        version: expect.any(String),
      }),
    );
  });
});
