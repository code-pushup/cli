import { describe, expect, it } from 'vitest';
import type { RunnerConfig } from '@code-pushup/models';
import { PLUGIN_SLUG } from './constants.js';
import {
  PLUGIN_DESCRIPTION,
  PLUGIN_DOCS_URL,
  PLUGIN_TITLE,
  docCoveragePlugin,
} from './doc-coverage-plugin.js';

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
        sourceGlob: ['src/**/*.ts', '!**/*.spec.ts', '!**/*.test.ts'],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        slug: PLUGIN_SLUG,
        title: PLUGIN_TITLE,
        icon: 'folder-src',
        description: PLUGIN_DESCRIPTION,
        docsUrl: PLUGIN_DOCS_URL,
        groups: expect.any(Array),
        audits: expect.any(Array),
        runner: expect.any(Function),
      }),
    );
  });
});
