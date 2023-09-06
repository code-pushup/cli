import { executePlugin, executePlugins } from './execute-plugin';
import { mockPluginConfig } from './mock/schema-helper.mock';
import {
  pluginConfigSchema,
  runnerOutputSchema,
} from '@quality-metrics/models';
import { describe, it, expect, vi } from 'vitest';

describe('executePlugin', () => {
  it('should work with valid plugin', async () => {
    const cfg = pluginConfigSchema.parse(mockPluginConfig());
    const expectedResult = [
      {
        slug: 'mock-audit-slug',
        value: 0,
      },
    ];
    const errorSpy = vi.fn();
    const pluginResult = await executePlugin(cfg).catch(errorSpy);
    expect(pluginResult.audits).toEqual(expectedResult);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(() => runnerOutputSchema.parse(pluginResult)).not.toThrow();
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

    let error: Error;
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
    // console.log('plugins', plugins[0].audits[0]);
    const errorSpy = vi.fn();
    const pluginResult = await executePlugins(plugins).catch(errorSpy);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(pluginResult.audits).toEqual([]);
    expect(() => runnerOutputSchema.parse(pluginResult)).not.toThrow();
  });

  it('should throws with invalid plugins', async () => {
    const plugins = [mockPluginConfig({ auditSlug: '-invalid-slug' })];
    const errorSpy = vi.fn();
    const pluginResult = await executePlugins(plugins).catch(errorSpy);
    expect(pluginResult).toBe(undefined);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
