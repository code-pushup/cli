import { describe, expect, it, vi } from 'vitest';
import { PLUGIN_SLUG, groups } from './constants.js';
import {
  PLUGIN_DESCRIPTION,
  PLUGIN_DOCS_URL,
  PLUGIN_TITLE,
  jsDocsPlugin,
} from './jsdocs-plugin.js';
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

describe('jsDocsPlugin', () => {
  it('should create a valid plugin config', () => {
    expect(
      jsDocsPlugin({
        patterns: ['src/**/*.ts', '!**/*.spec.ts', '!**/*.test.ts'],
      }),
    ).toStrictEqual(
      expect.objectContaining({
        slug: PLUGIN_SLUG,
        title: PLUGIN_TITLE,
        icon: 'folder-docs',
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
      jsDocsPlugin({
        // @ts-expect-error testing invalid config
        patterns: 123,
      }),
    ).toThrow('Expected array, received number');
  });

  it('should filter groups', () => {
    const config = { patterns: ['src/**/*.ts'] };
    jsDocsPlugin(config);

    expect(filterGroupsByOnlyAudits).toHaveBeenCalledWith(groups, config);
  });

  it('should filter audits', async () => {
    const config = { patterns: ['src/**/*.ts'] };
    jsDocsPlugin(config);

    expect(filterAuditsByPluginConfig).toHaveBeenCalledWith(config);
  });

  it('should forward options to runner function', async () => {
    const config = { patterns: ['src/**/*.ts'] };
    jsDocsPlugin(config);

    expect(createRunnerFunction).toHaveBeenCalledWith(config);
  });
});
