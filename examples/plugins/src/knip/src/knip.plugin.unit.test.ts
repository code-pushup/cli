import { describe, expect, it } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { KNIP_AUDITS, KNIP_GROUPS, KNIP_PLUGIN_SLUG } from './constants';
import { knipPlugin } from './knip.plugin';

describe('knipPlugin-create-config-object', () => {
  it('should return valid PluginConfig', () => {
    const pluginConfig = knipPlugin({});
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual(
      expect.objectContaining({
        slug: KNIP_PLUGIN_SLUG,
        title: 'Knip',
        icon: 'folder-javascript',
        description: 'A plugin to track dependencies and duplicates',
        audits: KNIP_AUDITS,
        groups: KNIP_GROUPS,
      }),
    );
  });
});
