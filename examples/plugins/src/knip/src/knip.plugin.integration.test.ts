import { describe, expect, it } from 'vitest';
import { auditSchema, pluginConfigSchema } from '@code-pushup/models';
import { AUDITS } from './constants';
import knipPlugin from './knip.plugin';

describe('knip-create', () => {
  it('should return valid PluginConfig', () => {
    const pluginConfig = knipPlugin({});
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual(
      expect.objectContaining({
        audits: AUDITS,
        description: 'A plugin to trac dependencies and duplicates',
        icon: 'folder-javascript',
        slug: 'knip',
        title: 'Knip',
      }),
    );
  });
});

describe('AUDITS', () => {
  it.each(AUDITS.map(audit => [audit.slug, audit]))(
    'should be a valid %s audit meta info',
    (_, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
    },
  );
});
