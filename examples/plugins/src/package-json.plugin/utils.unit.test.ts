import { vol } from 'memfs';
import { join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { multiPackageFileStructure, packageJsonName } from '../../mocks';
import { crawlFileSystem, findLineNumberInText } from './utils';

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

describe('crawlFileSystem', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON(multiPackageFileStructure, outputDir);
  });

  it('should list all files in file system', async () => {
    await expect(
      crawlFileSystem({
        directory: outputDir,
      }),
    ).resolves.toEqual([
      expect.stringContaining(join('README.md')),
      expect.stringContaining(join(packageJsonName)),
      expect.stringContaining(join('README.md')),
      expect.stringContaining(join(packageJsonName)),
      expect.stringContaining(join('README.md')),
      expect.stringContaining(join(packageJsonName)),
    ]);
  });

  it('should list files matching a pattern', async () => {
    await expect(
      crawlFileSystem({
        directory: outputDir,
        pattern: /\.json$/,
      }),
    ).resolves.toEqual([
      expect.stringContaining(join(packageJsonName)),
      expect.stringContaining(join(packageJsonName)),
      expect.stringContaining(join(packageJsonName)),
    ]);
  });

  it('should apply sync fileTransform function if given', async () => {
    await expect(
      crawlFileSystem({
        directory: outputDir,
        pattern: /\.json$/,
        fileTransform: () => '42',
      }),
    ).resolves.toEqual([
      expect.stringContaining('42'),
      expect.stringContaining('42'),
      expect.stringContaining('42'),
    ]);
  });

  it('should apply async fileTransform function if given', async () => {
    await expect(
      crawlFileSystem({
        directory: outputDir,
        pattern: /\.json$/,
        fileTransform: () => Promise.resolve('42'),
      }),
    ).resolves.toEqual([
      expect.stringContaining('42'),
      expect.stringContaining('42'),
      expect.stringContaining('42'),
    ]);
  });
});

describe('findLineNumber', () => {
  it('should return correct line number', () => {
    expect(
      findLineNumberInText(
        `
    1
    2 xxx
    3
    `,
        'x',
      ),
    ).toBe(3);
  });

  it('should return null if pattern not in content', () => {
    expect(findLineNumberInText(``, 'x')).toBeNull();
  });
});
