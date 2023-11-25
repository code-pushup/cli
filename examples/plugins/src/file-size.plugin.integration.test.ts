import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import { categoryRefSchema, pluginConfigSchema } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import {
  PluginOptions,
  audits,
  create,
  recommendedRefs,
  pluginSlug as slug,
} from './file-size.plugin';

// Mock file system API's
vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputDir = MEMFS_VOLUME;
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
    directory: outputDir,
  };

  beforeEach(() => {
    vol.reset();
    vol.fromJSON(
      {
        'project.json': projectJson,
        'src/test.js': testJs,
      },
      outputDir,
    );
  });

  it('should return valid PluginConfig', async () => {
    const pluginConfig = await create(baseOptions);
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
    const pluginConfig = await create(baseOptions);
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

  it('should use pattern', async () => {
    const pluginConfig = await create({
      ...baseOptions,
      pattern: /\.js$/,
    });
    const { audits } = await executePlugin(pluginConfig);

    expect(audits).toHaveLength(1);
    expect(audits?.[0]?.score).toBe(1);
    expect(audits?.[0]?.details?.issues).toHaveLength(1);
  });

  it('should use budget', async () => {
    const pluginConfig = await create({
      ...baseOptions,
      budget: 0,
    });
    const { audits } = await executePlugin(pluginConfig);

    expect(audits).toHaveLength(1);
    expect(audits?.[0]?.score).toBe(0);
    expect(audits?.[0]?.details?.issues).toHaveLength(2);
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
