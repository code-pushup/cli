import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import {
  auditSchema,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  type PluginOptions,
  audits,
  create,
  recommendedRefs,
  pluginSlug as slug,
} from './file-size.plugin.js';

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
const testJs = `
    const str = 'Hello World'
    const num = 42;
    const obj = ${projectJson};
  `;

describe('create', () => {
  const baseOptions: PluginOptions = {
    directory: '/',
  };

  beforeEach(() => {
    vol.fromJSON(
      {
        'project.json': projectJson,
        'src/test.js': testJs,
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
        'A plugin to measure and assert size of files in a directory.',
      icon: 'folder-javascript',
      runner: expect.any(Function),
      slug,
      title: 'File Size',
    });
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = create(baseOptions);
    await expect(
      executePlugin(pluginConfig, {
        persist: { outputDir: '.code-pushup' },
        cache: { read: false, write: false },
      }),
    ).resolves.toMatchObject({
      description:
        'A plugin to measure and assert size of files in a directory.',
      slug,
      title: 'File Size',
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.any(Array),
    });
  });

  it('should use pattern', async () => {
    const pluginConfig = create({
      ...baseOptions,
      pattern: /\.js$/,
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig, {
      persist: { outputDir: '.code-pushup' },
      cache: { read: false, write: false },
    });

    expect(auditOutputs).toHaveLength(1);
    expect(auditOutputs[0]?.score).toBe(1);
    expect(auditOutputs[0]?.details?.issues).toHaveLength(1);
  });

  it('should use budget', async () => {
    const pluginConfig = create({
      ...baseOptions,
      budget: 0,
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig, {
      persist: { outputDir: '.code-pushup' },
      cache: { read: false, write: false },
    });

    expect(auditOutputs).toHaveLength(1);
    expect(auditOutputs[0]?.score).toBe(0);
    expect(auditOutputs[0]?.details?.issues).toHaveLength(2);
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
