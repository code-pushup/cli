import { describe, expect, it, vi } from 'vitest';
import { PLUGIN_SLUG, groups } from './constants.js';
import {
  PLUGIN_DESCRIPTION,
  PLUGIN_DOCS_URL,
  PLUGIN_TITLE,
  docCoveragePlugin,
} from './doc-coverage-plugin.js';
import { createRunnerFunction } from './runner/runner.js';
import {
  filterAuditsByPluginConfig,
  filterGroupsByOnlyAudits,
} from './utils.js';

vi.mock('./utils.js', () => ({
  filterAuditsByPluginConfig: vi.fn().mockReturnValue(['mockAudit']),
  filterGroupsByOnlyAudits: vi.fn().mockReturnValue(['mockGroup']),
}));

vi.mock('./runner/runner.js', () => ({
  createRunnerFunction: vi.fn().mockReturnValue(() => Promise.resolve([])),
}));

describe('docCoveragePlugin', () => {
  it('should create a valid plugin config', () => {
    expect(
      docCoveragePlugin({
        sourceGlob: ['src/**/*.ts', '!**/*.spec.ts', '!**/*.test.ts'],
      }),
    ).toStrictEqual(
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

  it('should throw for invalid plugin options', () => {
    expect(() =>
      docCoveragePlugin({
        // @ts-expect-error testing invalid config
        sourceGlob: 123,
      }),
    ).toThrow('Expected array, received number');
  });

  it('should filter groups', () => {
    const config = { sourceGlob: ['src/**/*.ts'] };
    docCoveragePlugin(config);

    expect(filterGroupsByOnlyAudits).toHaveBeenCalledWith(groups, config);
  });

  it('should filter audits', async () => {
    const config = { sourceGlob: ['src/**/*.ts'] };
    docCoveragePlugin(config);

    expect(filterAuditsByPluginConfig).toHaveBeenCalledWith(config);
  });

  it('should forward options to runner function', async () => {
    const config = { sourceGlob: ['src/**/*.ts'] };
    docCoveragePlugin(config);

    expect(createRunnerFunction).toHaveBeenCalledWith(config);
  });
});
