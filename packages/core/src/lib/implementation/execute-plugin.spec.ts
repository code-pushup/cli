import { describe, expect, it } from 'vitest';
import { auditOutputsSchema } from '@code-pushup/models';
import {
  config,
  eslintPluginConfig,
  report,
} from '@code-pushup/models/testing';
import { executePlugin, executePlugins } from './execute-plugin';

describe('executePlugin', () => {
  it('should work with valid plugin', async () => {
    const pluginResult = await executePlugin(eslintPluginConfig());
    expect(pluginResult.audits[0]?.slug).toBe('mock-audit-slug');
    expect(() => auditOutputsSchema.parse(pluginResult.audits)).not.toThrow();
  });

  it('should throws with invalid plugin audits slug', async () => {
    const pluginConfig = eslintPluginConfig();

    pluginConfig.audits[0] = {
      ...pluginConfig?.audits[0],
      title: '',
      slug: '-invalid-audit-slug',
    };
    await expect(() => executePlugin(pluginConfig)).rejects.toThrowError();
  });

  it('should throw if invalid runnerOutput is produced', async () => {
    const pluginConfig = eslintPluginConfig();
    const outputFile = './tmp/out.json';
    const invalidReport = report() as any;
    invalidReport.plugins[0].audits[0].slug = {
      '': '-' + invalidReport.plugins[0].audits[0].slug,
    };

    pluginConfig.runner = {
      command: 'node',
      args: [
        '-e',
        `require('fs').writeFileSync('${outputFile}', '${JSON.stringify(
          invalidReport,
        )}')`,
      ],
      outputFile,
    };
    await expect(() => executePlugin(pluginConfig)).rejects.toThrowError(
      'Plugin output of plugin with slug mock-plugin-slug',
    );
  });
});

describe('executePlugins', () => {
  it('should work with valid plugins', async () => {
    const pluginResult = await executePlugins(config().plugins);
    expect(pluginResult[0]?.date.endsWith('Z')).toBeTruthy();
    expect(pluginResult[0]?.duration).toMatch(expect.any(Number));
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
    const plugins = config().plugins as any;
    plugins[0].audits[0].slug = '-invalid-slug';
    await expect(() => executePlugins(plugins)).rejects.toThrowError();
  });
});
