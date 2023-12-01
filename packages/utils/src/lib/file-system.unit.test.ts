import { stat } from 'fs/promises';
import { vol } from 'memfs';
import { join } from 'path';
import process from 'process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/models/testing';
import {
  FileResult,
  NoExportError,
  crawlFileSystem,
  ensureDirectoryExists,
  findLineNumberInText,
  importEsmModule,
  logMultipleFileResults,
  toUnixPath,
} from './file-system';
import * as logResults from './log-results';

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

describe('toUnixPath', () => {
  it.each([
    ['main.ts', 'main.ts'],
    ['src/main.ts', 'src/main.ts'],
    ['../../relative/unix/path/index.ts', '../../relative/unix/path/index.ts'],
    [
      '..\\..\\relative\\windows\\path\\index.ts',
      '../../relative/windows/path/index.ts',
    ],
  ])('should transform "%s" to valid slug "%s"', (path, unixPath) => {
    expect(toUnixPath(path)).toBe(unixPath);
  });

  it('should transform absolute Windows path to relative UNIX path', () => {
    expect(
      toUnixPath(`${process.cwd()}\\windows\\path\\config.ts`, {
        toRelative: true,
      }),
    ).toBe('windows/path/config.ts');
  });
});

describe('ensureDirectoryExists', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, outputDir);
  });

  it('should create folder', async () => {
    const dir = join(MEMFS_VOLUME, 'sub', 'dir');
    await ensureDirectoryExists(dir);
    await expect(
      stat(dir).then(stats => stats.isDirectory()),
    ).resolves.toBeTruthy();
  });
});

describe('logMultipleFileResults', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call logMultipleResults with the correct arguments', () => {
    const logMultipleResultsSpy = vi.spyOn(
      logResults,
      'logMultipleResults' as never,
    );
    const persistResult = [
      {
        status: 'fulfilled',
        value: ['out.json', 10000],
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

const getFilepath = (fileName: string) =>
  join(process.cwd(), 'packages', 'utils', 'test', 'fixtures', fileName);

describe('importEsmModule', () => {
  it('should load file', async () => {
    const module = await importEsmModule<{ name: string }>({
      filepath: getFilepath('valid-export.mjs'),
    });
    expect(module).toBe('valid-export');
  });

  it('should throw if file does not exist', async () => {
    await expect(
      importEsmModule<{ name: string }>({
        filepath: join('invalid-path', 'not-existing-export.mjs'),
      }),
    ).rejects.toThrow('not-existing-export.mjs');
  });

  it('should throw if export is not defined', async () => {
    const filepath = getFilepath('no-export.mjs');
    await expect(
      importEsmModule<{ name: string }>({
        filepath,
      }),
    ).rejects.toThrow(new NoExportError(filepath));
  });

  it('should throw if export is undefined', async () => {
    const filepath = getFilepath('undefined-export.mjs');
    await expect(
      importEsmModule<{ name: string }>({
        filepath,
      }),
    ).rejects.toThrow(new NoExportError(filepath));
  });
});

describe('crawlFileSystem', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON(
      {
        ['README.md']: '# Markdown',
        ['src/README.md']: '# Markdown',
        ['src/index.ts']: 'const var = "markdown";',
      },
      outputDir,
    );
  });

  it('should list all files in file system', async () => {
    await expect(
      crawlFileSystem({
        directory: outputDir,
      }),
    ).resolves.toEqual([
      expect.stringContaining(join('README.md')),
      expect.stringContaining(join('README.md')),
      expect.stringContaining(join('index.ts')),
    ]);
  });

  it('should list files matching a pattern', async () => {
    await expect(
      crawlFileSystem({
        directory: outputDir,
        pattern: /\.md$/,
      }),
    ).resolves.toEqual([
      expect.stringContaining(join('README.md')),
      expect.stringContaining(join('README.md')),
    ]);
  });

  it('should apply sync fileTransform function if given', async () => {
    await expect(
      crawlFileSystem({
        directory: outputDir,
        pattern: /\.md$/,
        fileTransform: () => '42',
      }),
    ).resolves.toEqual([
      expect.stringContaining('42'),
      expect.stringContaining('42'),
    ]);
  });

  it('should apply async fileTransform function if given', async () => {
    await expect(
      crawlFileSystem({
        directory: outputDir,
        pattern: /\.md$/,
        fileTransform: () => Promise.resolve('42'),
      }),
    ).resolves.toEqual([
      expect.stringContaining('42'),
      expect.stringContaining('42'),
    ]);
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

  it('should return null if pattern not in content', () => {
    expect(findLineNumberInText(``, 'x')).toBeNull();
  });
});
