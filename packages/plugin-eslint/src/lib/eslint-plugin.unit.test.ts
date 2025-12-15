import { pluginConfigSchema } from '@code-pushup/models';
import { eslintPlugin } from './eslint-plugin.js';
import * as metaModule from './meta/list.js';

describe('eslintPlugin', () => {
  const listAuditsAndGroupsSpy = vi.spyOn(metaModule, 'listAuditsAndGroups');

  beforeAll(() => {
    listAuditsAndGroupsSpy.mockResolvedValue({
      audits: [{ slug: 'type-safety', title: 'Type Safety' }],
      groups: [],
    });
  });

  it('should pass scoreTargets to PluginConfig when provided', async () => {
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
});
