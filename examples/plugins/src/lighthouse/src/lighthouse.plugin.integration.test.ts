import { describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import {
  auditSchema,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import {
  PluginOptions,
  create,
} from './lighthouse.plugin';
import {recommendedRefs, audits, pluginSlug as slug} from './index';

describe('create', () => {
  const baseOptions: PluginOptions = {
    url: 'https://example.com',
  };

  it('should return valid PluginConfig', () => {
    const pluginConfig = create(baseOptions);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      slug,
      title: 'Lighthouse',
      description:
        'Chrome lighthouse CLI as code-pushup plugin',
      icon: 'lighthouse',
      runner: expect.any(Object),
      audits,
      groups: expect.any(Array),
    });
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = create(baseOptions);
    await expect(executePlugin(pluginConfig)).resolves.toMatchObject(expect.objectContaining({
      slug,
      title: 'Lighthouse',
      description:
        'Chrome lighthouse CLI as code-pushup plugin',
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.any(Array),
      groups: expect.any(Array),
    }));
  }, 20_000);

  it('should use onlyAudits', async () => {
    const pluginConfig = create({
      ...baseOptions,
      onlyAudits: 'largest-contentful-paint',
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(60);
    expect(auditOutputs[0]?.score).toBe(expect.any(Number));
    expect(auditOutputs[0]?.details).toBe(expect.any(Number));
  });
}, 20_000);

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
