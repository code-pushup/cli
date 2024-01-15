import { describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import {
  auditSchema,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import {
  PluginOptions,
  audits,
  create,
  recommendedRefs,
  pluginSlug as slug,
} from './lighthouse.plugin';

describe('create', () => {
  const baseOptions: PluginOptions = {
    url: 'https://example.com',
  };

  it('should return valid PluginConfig', () => {
    const pluginConfig = create(baseOptions);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      audits,
      description:
        'A plugin to measure and assert size of files in a directory.',
      icon: 'folder-javascript',
      runner: expect.any(Function),
      slug,
      title: 'File Size',
    });
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = create(baseOptions);
    await expect(executePlugin(pluginConfig)).resolves.toMatchObject({
      description:
        'A plugin to measure and assert size of files in a directory.',
      slug,
      title: 'File Size',
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.any(Array),
    });
  });

  it('should use onlyAudits', async () => {
    const pluginConfig = create({
      ...baseOptions,
      onlyAudits: 'largest-contentful-paint',
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(1);
    expect(auditOutputs[0]?.score).toBe(1);
    expect(auditOutputs[0]?.details).toBe(1);
  });
});

describe('audits', () => {
  it.each(audits)('should be a valid audit meta info', audit => {
    expect(() => auditSchema.parse(audit)).not.toThrow();
  });
});

describe('recommendedRefs', () => {
  it.each(recommendedRefs)(
    'should be a valid category reference',
    categoryRef => {
      expect(() => categoryRefSchema.parse(categoryRef)).not.toThrow();
    },
  );
});
