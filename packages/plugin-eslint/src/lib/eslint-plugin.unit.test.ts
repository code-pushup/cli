import { pluginConfigSchema } from '@code-pushup/models';
import { eslintPlugin } from './eslint-plugin.js';
import * as metaModule from './meta/index.js';

describe('eslintPlugin', () => {
  const listAuditsAndGroupsSpy = vi.spyOn(metaModule, 'listAuditsAndGroups');

  beforeAll(() => {
    listAuditsAndGroupsSpy.mockResolvedValue({
      audits: [
        { slug: 'type-safety', title: 'Type Safety' },
        { slug: 'no-empty', title: 'Disallow empty block statements' },
      ],
      groups: [],
    });
  });

  it('should pass scoreTargets to PluginConfig when provided', async () => {
    const pluginConfig = await eslintPlugin(
      {
        eslintrc: 'eslint.config.js',
        patterns: ['src/**/*.js'],
      },
      { scoreTargets: 0.8 },
    );

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.scoreTargets).toBe(0.8);
  });

  it('should pass object scoreTargets to PluginConfig', async () => {
    const scoreTargets = { 'type-safety': 0.9 };
    const pluginConfig = await eslintPlugin(
      {
        eslintrc: 'eslint.config.js',
        patterns: ['src/**/*.js'],
      },
      { scoreTargets },
    );

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig.scoreTargets).toStrictEqual(scoreTargets);
  });

  it('should not have scoreTargets when not provided', async () => {
    const pluginConfig = await eslintPlugin({
      eslintrc: 'eslint.config.js',
      patterns: ['src/**/*.js'],
    });

    expect(pluginConfig.scoreTargets).toBeUndefined();
  });
});
