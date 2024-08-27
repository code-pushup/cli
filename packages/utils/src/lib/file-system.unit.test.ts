import { vol } from 'memfs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  type FileResult,
  crawlFileSystem,
  ensureDirectoryExists,
  filePathToCliArg,
  findLineNumberInText,
  logMultipleFileResults,
} from './file-system';
import * as logResults from './log-results';

describe('ensureDirectoryExists', () => {
  it('should create a nested folder', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    const dir = join(MEMFS_VOLUME, 'sub', 'dir');

    await ensureDirectoryExists(dir);
    await expect(
      stat(dir).then(stats => stats.isDirectory()),
    ).resolves.toBeTruthy();
  });
});

describe('logMultipleFileResults', () => {
  it('should call logMultipleResults with the correct arguments', () => {
    const logMultipleResultsSpy = vi.spyOn(
      logResults,
      'logMultipleResults' as never,
    );
    const persistResult = [
      {
        status: 'fulfilled',
        value: ['out.json', 10_000],
      } as PromiseFulfilledResult<FileResult>,
    ];
    const messagePrefix = 'Generated reports';

    logMultipleFileResults(persistResult, messagePrefix);

    expect(logMultipleResultsSpy).toHaveBeenCalled();
    expect(logMultipleResultsSpy).toHaveBeenCalledWith(
      persistResult,
      messagePrefix,
      expect.any(Function),
      expect.any(Function),
    );
  });
});

describe('crawlFileSystem', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        ['README.md']: '# Markdown',
        ['src/README.md']: '# Markdown',
        ['src/index.ts']: 'const var = "markdown";',
      },
      MEMFS_VOLUME,
    );
  });

  it('should list all files in file system', async () => {
    await expect(
      crawlFileSystem({
        directory: MEMFS_VOLUME,
      }),
    ).resolves.toEqual([
      expect.stringContaining('README.md'),
      expect.stringContaining(join('src', 'README.md')),
      expect.stringContaining(join('src', 'index.ts')),
    ]);
  });

  it('should list files matching a pattern', async () => {
    await expect(
      crawlFileSystem({
        directory: MEMFS_VOLUME,
        pattern: /\.md$/,
      }),
    ).resolves.toEqual([
      expect.stringContaining('README.md'),
      expect.stringContaining(join('src', 'README.md')),
    ]);
  });

  it('should apply sync fileTransform function if given', async () => {
    await expect(
      crawlFileSystem({
        directory: MEMFS_VOLUME,
        pattern: /\.md$/,
        fileTransform: () => '42',
      }),
    ).resolves.toEqual(['42', '42']);
  });

  it('should apply async fileTransform function if given', async () => {
    await expect(
      crawlFileSystem({
        directory: MEMFS_VOLUME,
        pattern: /\.md$/,
        fileTransform: () => Promise.resolve('42'),
      }),
    ).resolves.toEqual(['42', '42']);
  });
});

describe('findLineNumberInText', () => {
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

  it('should return line number of the first pattern occurrence', () => {
    expect(
      findLineNumberInText(
        `
    1 xxx
    2
    3 xxx
    `,
        'x',
      ),
    ).toBe(2);
  });

  it('should return null if pattern not in content', () => {
    expect(findLineNumberInText(``, 'x')).toBeNull();
  });
});

describe('filePathToCliArg', () => {
  it('should wrap path in quotes', () => {
    expect(filePathToCliArg('My Project/index.js')).toBe(
      '"My Project/index.js"',
    );
  });
});
