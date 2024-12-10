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
  findNearestFile,
  logMultipleFileResults,
  projectToFilename,
} from './file-system.js';
import * as logResults from './log-results.js';

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
        'README.md': '# Markdown',
        'src/README.md': '# Markdown',
        'src/index.ts': 'const var = "markdown";',
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

describe('findNearestFile', () => {
  it('should find file in current working directory', async () => {
    vol.fromJSON(
      {
        'eslint.config.js': '',
      },
      MEMFS_VOLUME,
    );
    await expect(findNearestFile(['eslint.config.js'])).resolves.toBe(
      join(MEMFS_VOLUME, 'eslint.config.js'),
    );
  });

  it('should find first matching file in array', async () => {
    vol.fromJSON(
      {
        'eslint.config.cjs': '',
        'eslint.config.mjs': '',
      },
      MEMFS_VOLUME,
    );
    await expect(
      findNearestFile([
        'eslint.config.js',
        'eslint.config.cjs',
        'eslint.config.mjs',
      ]),
    ).resolves.toBe(join(MEMFS_VOLUME, 'eslint.config.cjs'));
  });

  it('should resolve to undefined if file not found', async () => {
    vol.fromJSON({ '.eslintrc.json': '' }, MEMFS_VOLUME);
    await expect(
      findNearestFile([
        'eslint.config.js',
        'eslint.config.cjs',
        'eslint.config.mjs',
      ]),
    ).resolves.toBeUndefined();
  });

  it('should find file in parent directory', async () => {
    vol.fromJSON(
      {
        'eslint.config.js': '',
        'e2e/main.spec.js': '',
      },
      MEMFS_VOLUME,
    );
    await expect(
      findNearestFile(
        ['eslint.config.js', 'eslint.config.cjs', 'eslint.config.mjs'],
        join(MEMFS_VOLUME, 'e2e'),
      ),
    ).resolves.toBe(join(MEMFS_VOLUME, 'eslint.config.js'));
  });

  it('should find file in directory multiple levels up', async () => {
    vol.fromJSON(
      {
        'eslint.config.cjs': '',
        'packages/core/package.json': '',
      },
      MEMFS_VOLUME,
    );
    await expect(
      findNearestFile(
        ['eslint.config.js', 'eslint.config.cjs', 'eslint.config.mjs'],
        join(MEMFS_VOLUME, 'packages/core'),
      ),
    ).resolves.toBe(join(MEMFS_VOLUME, 'eslint.config.cjs'));
  });

  it("should find file that's nearest to current folder", async () => {
    vol.fromJSON(
      {
        'eslint.config.js': '',
        'packages/core/eslint.config.js': '',
        'packages/core/package.json': '',
      },
      MEMFS_VOLUME,
    );
    await expect(
      findNearestFile(
        ['eslint.config.js', 'eslint.config.cjs', 'eslint.config.mjs'],
        join(MEMFS_VOLUME, 'packages/core'),
      ),
    ).resolves.toBe(join(MEMFS_VOLUME, 'packages/core/eslint.config.js'));
  });

  it('should not find file in sub-folders of current folder', async () => {
    vol.fromJSON({ 'packages/core/eslint.config.js': '' }, MEMFS_VOLUME);
    await expect(
      findNearestFile([
        'eslint.config.js',
        'eslint.config.cjs',
        'eslint.config.mjs',
      ]),
    ).resolves.toBeUndefined();
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

describe('projectToFilename', () => {
  it.each([
    ['frontend', 'frontend'],
    ['@code-pushup/utils', 'code-pushup-utils'],
    ['Web API', 'Web-API'],
    ['backend/shared/auth', 'backend-shared-auth'],
  ])('should convert project name %p to file name %p', (project, file) => {
    expect(projectToFilename(project)).toBe(file);
  });
});
