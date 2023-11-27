import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import { categoryRefSchema, pluginConfigSchema } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { multiPackageFileStructure } from '../../mocks';
import {
  PluginOptions,
  audits,
  create,
  recommendedRefs,
  pluginSlug as slug,
} from './package-json.plugin';

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

describe('create', () => {
  const baseOptions: PluginOptions = {
    directory: outputDir,
    requiredDependencies: {
      dependencies: {
        lib1: '0.0.0',
      },
    },
  };

  beforeEach(() => {
    vol.reset();
    vol.fromJSON(multiPackageFileStructure, outputDir);
  });

  it('should return valid PluginConfig', async () => {
    const pluginConfig = await create(baseOptions);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      audits,
      description: 'A plugin to validate package.json files.',
      icon: 'javascript',
      runner: expect.any(Function),
      slug,
      title: 'Package Json',
    });
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = await create(baseOptions);
    await expect(executePlugin(pluginConfig)).resolves.toMatchObject({
      description: 'A plugin to validate package.json files.',
      slug,
      title: 'Package Json',
      duration: expect.any(Number),
      date: expect.any(String),
      audits: expect.any(Array),
    });
  });

  it('should error for invalid deps', async () => {
    const pluginConfig = await create({
      ...baseOptions,
      requiredDependencies: {
        dependencies: {
          lib1: '0.0.1',
        },
      },
    });
    const { audits } = await executePlugin(pluginConfig);

    expect(audits).toHaveLength(2);
    expect(audits?.[0]?.score).toBe(0);
    expect(audits?.[0]?.details?.issues).toHaveLength(3);
    expect(audits?.[0]?.details?.issues?.[0]?.message).toContain(
      'Wanted 0.0.1',
    );
    expect(audits?.[1]?.score).toBe(1);
    expect(audits?.[1]?.displayValue).toContain('No license required');
    expect(audits?.[1]?.details?.issues).toBeUndefined();
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
