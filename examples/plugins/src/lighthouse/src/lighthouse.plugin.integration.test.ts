import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import {
  auditSchema,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { LIGHTHOUSE_URL } from '../mock/constants';
import { lhr } from '../mock/fixtures/lhr';
import { LIGHTHOUSE_OUTPUT_FILE_DEFAULT, corePerfGroupRefs } from './constants';
import { audits, recommendedRefs, pluginSlug as slug } from './index';
import { PluginOptions, create } from './lighthouse.plugin';

describe('lighthouse-create-export', () => {
  const baseOptions: PluginOptions = {
    url: LIGHTHOUSE_URL,
  };

  beforeEach(() => {
    vol.fromJSON(
      {
        [LIGHTHOUSE_OUTPUT_FILE_DEFAULT]: JSON.stringify(lhr),
      },
      MEMFS_VOLUME,
    );
  });

  it('should return valid PluginConfig', () => {
    const pluginConfig = create(baseOptions);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      slug,
      title: 'Lighthouse',
      description: 'Chrome lighthouse CLI as code-pushup plugin',
      icon: 'lighthouse',
      runner: expect.any(Object),
      audits,
      groups: expect.any(Array),
    });
  });

  it('should use parse options to lighthouse options', async () => {
    const pluginConfig = create({
      ...baseOptions,
      headless: true,
    });
    expect(pluginConfig).toEqual(
      expect.objectContaining({
        runner: expect.objectContaining({
          args: expect.arrayContaining(['--chrome-flags="--headless=new"']),
        }),
      }),
    );
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = create(baseOptions);
    await expect(executePlugin(pluginConfig)).resolves.toMatchObject(
      expect.objectContaining({
        slug,
        title: 'Lighthouse',
        description: 'Chrome lighthouse CLI as code-pushup plugin',
        duration: expect.any(Number),
        date: expect.any(String),
        audits: expect.any(Array),
        groups: expect.any(Array),
      }),
    );
  });

  it('should use onlyAudits', async () => {
    const pluginConfig = create({
      ...baseOptions,
      onlyAudits: 'largest-contentful-paint',
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(1);
  });
}, 30_000);

describe('lighthouse-audits-export', () => {
  it.each(audits)('should be a valid audit meta info', audit => {
    expect(() => auditSchema.parse(audit)).not.toThrow();
  });
});

describe('lighthouse-recommendedRefs-export', () => {
  it.each(recommendedRefs)(
    'should be a valid category reference',
    categoryRef => {
      expect(() => categoryRefSchema.parse(categoryRef)).not.toThrow();
    },
  );
});

describe('lighthouse-corePerfGroupRefs-export', () => {
  it.each(corePerfGroupRefs)(
    'should be a valid category reference',
    categoryRef => {
      expect(() => categoryRefSchema.parse(categoryRef)).not.toThrow();
    },
  );
});
