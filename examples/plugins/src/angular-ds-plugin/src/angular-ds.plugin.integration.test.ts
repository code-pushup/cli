import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import {
  auditSchema,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import {
  PluginOptions,
  audits,
  create,
  recommendedRefs,
  pluginSlug as slug,
} from './angular-ds.plugin';

const projectJson = JSON.stringify(
  {
    test: 42,
    arr: [1, 2, 3],
    obj: {
      test: 42,
    },
  },
  null,
  2,
);

describe('create', () => {
  const baseOptions: PluginOptions = {
    directory: '/',
    variableImportPattern: 'generated',
  };

  beforeEach(() => {
    vol.fromJSON(
      {
        'project.json': projectJson,
      },
      MEMFS_VOLUME,
    );
  });

  it('should return valid PluginConfig', () => {
    const pluginConfig = create(baseOptions);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      audits,
      description:
        'A plugin to measure and assert filesize of files in a directory.',
      icon: 'javascript',
      runner: expect.any(Function),
      slug,
      title: 'File Size',
    });
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = create(baseOptions);
    await expect(executePlugin(pluginConfig)).resolves.toMatchObject({
      description:
        'A plugin to measure and assert filesize of files in a directory.',
      slug,
      title: 'File Size',
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.any(Array),
    });
  });

  it('should use variableImportPattern', async () => {
    const pluginConfig = create({
      ...baseOptions,
      variableImportPattern: 'generated',
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(1);
    expect(auditOutputs[0]?.score).toBe(1);
    expect(auditOutputs[0]?.details?.issues).toHaveLength(1);
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
