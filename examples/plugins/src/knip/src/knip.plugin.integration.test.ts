import { describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import { auditSchema, pluginConfigSchema } from '@code-pushup/models';
import { AUDITS } from './constants';
import knipPlugin from './knip.plugin';

describe('knip-create', () => {
  it('should return valid PluginConfig', () => {
    const pluginConfig = knipPlugin({});
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      audits: AUDITS,
      description:
        'A plugin to measure and assert size of files in a directory.',
      icon: 'folder-javascript',
      runner: expect.any(Function),
      slug: 'knip',
      title: 'File Size',
    });
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = knipPlugin({});
    await expect(executePlugin(pluginConfig)).resolves.toMatchObject({
      description:
        'A plugin to measure and assert size of files in a directory.',
      slug: 'knip',
      title: 'File Size',
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.any(Array),
    });
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
