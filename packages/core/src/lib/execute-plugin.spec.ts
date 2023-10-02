import {
  auditOutputsSchema,
  pluginConfigSchema,
} from '@quality-metrics/models';
import { mockPluginConfig } from '@quality-metrics/models/testing';
import { describe, expect, it } from 'vitest';
import { executePlugin, executePlugins } from './execute-plugin';

describe('executePlugin', () => {
  it('should work with valid plugin', async () => {
    const cfg = pluginConfigSchema.parse(mockPluginConfig());
    const pluginResult = await executePlugin(cfg);
    expect(pluginResult.audits[0]?.slug).toBe('mock-audit-slug');
    expect(() => auditOutputsSchema.parse(pluginResult.audits)).not.toThrow();
  });

  it('should throws with invalid plugin', async () => {
    const cfg = mockPluginConfig({ auditSlug: '-invalid-audit-slug' });
    await expect(() => executePlugin(cfg)).rejects.toThrowError();
  });

  it('should throw if invalid runnerOutput is produced', async () => {
    const cfg = mockPluginConfig({ auditSlug: '-invalid-audit-slug' });
    await expect(() => executePlugin(cfg)).rejects.toThrowError(
      'Plugin output of plugin with slug mock-plugin-slug',
    );
  });
});

describe('executePlugins', () => {
  it('should work with valid plugins', async () => {
    const plugins = [
      pluginConfigSchema.parse(
        mockPluginConfig({ pluginSlug: 'plugin-slug-1' }),
      ),
      pluginConfigSchema.parse(
        mockPluginConfig({ pluginSlug: 'plugin-slug-2', auditSlug: 'audit-2' }),
      ),
    ];
    const pluginResult = await executePlugins(plugins);
    expect(pluginResult[0]?.date.endsWith('Z')).toBeTruthy();
    expect(pluginResult[0]?.duration).toMatch(/^\d+$/);
    expect(pluginResult[0]?.audits[0]?.slug).toEqual('mock-audit-slug');
    expect(pluginResult[1]?.audits[0]?.slug).toEqual('audit-2');
    expect(() =>
      auditOutputsSchema.parse(pluginResult[0]?.audits),
    ).not.toThrow();
    expect(() =>
      auditOutputsSchema.parse(pluginResult[1]?.audits),
    ).not.toThrow();
  });

  it('should throws with invalid plugins', async () => {
    const plugins = [mockPluginConfig({ auditSlug: '-invalid-slug' })];
    await expect(() => executePlugins(plugins)).rejects.toThrowError();
  });
});
