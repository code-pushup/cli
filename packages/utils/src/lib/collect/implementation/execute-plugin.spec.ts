import { describe, it, expect, vi } from 'vitest';
import { executePlugin, executePlugins } from './execute-plugin';
import { mockPluginConfig } from '@quality-metrics/models/testing';
import {
  pluginConfigSchema,
  auditOutputsSchema,
} from '@quality-metrics/models';

describe('executePlugin', () => {
  it('should work with valid plugin', async () => {
    const cfg = pluginConfigSchema.parse(mockPluginConfig());
    const errorSpy = vi.fn();
    const pluginResult = await executePlugin(cfg).catch(errorSpy);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(pluginResult.audits[0].slug).toBe('mock-audit-slug');
    expect(() => auditOutputsSchema.parse(pluginResult.audits)).not.toThrow();
  });

  it('should throws with invalid plugin', async () => {
    const cfg = mockPluginConfig({ auditSlug: '-invalid-audit-slug' });
    const errorSpy = vi.fn();
    const pluginResult = await executePlugin(cfg).catch(errorSpy);
    expect(pluginResult).toBe(undefined);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw if invalid runnerOutput is produced', async () => {
    const cfg = mockPluginConfig({ auditSlug: '-invalid-audit-slug' });

    let error: Error = new Error();
    const pluginResult = await executePlugin(cfg).catch(e => {
      error = e;
    });
    expect(pluginResult).toBe(undefined);
    expect(error?.message).toContain(
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
    const errorSpy = vi.fn();
    const pluginResult = await executePlugins(plugins).catch(errorSpy);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(pluginResult[0].date.endsWith('Z')).toBeTruthy();
    expect(pluginResult[0].duration).toMatch(/^\d+$/);
    expect(pluginResult[0].audits[0].slug).toEqual('mock-audit-slug');
    expect(pluginResult[1].audits[0].slug).toEqual('audit-2');
    expect(() =>
      auditOutputsSchema.parse(pluginResult[0].audits),
    ).not.toThrow();
    expect(() =>
      auditOutputsSchema.parse(pluginResult[1].audits),
    ).not.toThrow();
  });

  it('should throws with invalid plugins', async () => {
    const plugins = [mockPluginConfig({ auditSlug: '-invalid-slug' })];
    const errorSpy = vi.fn();
    const pluginResult = await executePlugins(plugins).catch(errorSpy);
    expect(pluginResult).toBe(undefined);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
