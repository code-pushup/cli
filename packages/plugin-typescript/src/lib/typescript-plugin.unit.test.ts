import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { AUDITS, GROUPS } from './constants.js';
import type { TypescriptPluginOptions } from './schema.js';
import { typescriptPlugin } from './typescript-plugin.js';

describe('typescriptPlugin-config-object', () => {
  it('should create valid plugin config without options', async () => {
    const pluginConfig = await typescriptPlugin();

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(AUDITS.length);
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(GROUPS.length);
  });

  it('should create valid plugin config', async () => {
    const pluginConfig = await typescriptPlugin({
      tsconfig: 'mocked-away/tsconfig.json',
      onlyAudits: ['syntax-errors', 'semantic-errors', 'configuration-errors'],
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(3);
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(2);
  });

  it('should throw for invalid valid params', async () => {
    await expect(() =>
      typescriptPlugin({
        tsconfig: 42,
      } as unknown as TypescriptPluginOptions),
    ).rejects.toThrow(/invalid_type/);
  });

  it('should pass scoreTargets to PluginConfig when provided', async () => {
    const scoreTargets = { 'no-implicit-any-errors': 0.9 };
    const pluginConfig = await typescriptPlugin({
      scoreTargets,
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.scoreTargets).toStrictEqual(scoreTargets);
  });
});
