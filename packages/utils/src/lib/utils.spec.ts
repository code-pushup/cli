import { vol } from 'memfs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/models/testing';
import { mockConsole, unmockConsole } from '../../test/console.mock';
import {
  countOccurrences,
  distinct,
  ensureDirectoryExists,
  logMultipleFileResults,
  pluralize,
  toArray,
  toUnixPath,
} from './utils';

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

const resetFiles = async (files?: Record<string, string>) => {
  vol.reset();
  vol.fromJSON(files || {}, outputDir);
};

describe('pluralize', () => {
  it.each([
    ['warning', 'warnings'],
    ['error', 'errors'],
    ['category', 'categories'],
    ['status', 'statuses'],
  ])('should pluralize "%s" as "%s"', (singular, plural) => {
    expect(pluralize(singular)).toBe(plural);
  });
});

describe('toArray', () => {
  it('should transform non-array value into array with single value', () => {
    expect(toArray('src/**/*.ts')).toEqual(['src/**/*.ts']);
  });

  it('should leave array value unchanged', () => {
    expect(toArray(['*.ts', '*.js'])).toEqual(['*.ts', '*.js']);
  });
});

describe('countOccurrences', () => {
  it('should return record with counts for each item', () => {
    expect(
      countOccurrences(['error', 'warning', 'error', 'error', 'warning']),
    ).toEqual({ error: 3, warning: 2 });
  });
});

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

describe('distinct', () => {
  it('should remove duplicate strings from array', () => {
    expect(
      distinct([
        'no-unused-vars',
        'no-invalid-regexp',
        'no-unused-vars',
        'no-invalid-regexp',
        '@typescript-eslint/no-unused-vars',
      ]),
    ).toEqual([
      'no-unused-vars',
      'no-invalid-regexp',
      '@typescript-eslint/no-unused-vars',
    ]);
  });
});

describe('ensureDirectoryExists', () => {
  beforeEach(() => {
    resetFiles();
  });

  it('should create folder', async () => {
    resetFiles();
    expect(
      ensureDirectoryExists(join(outputDir, 'sub', 'dir')),
    ).resolves.toEqual(void 0);
  });

  it('should throw if path is a file path', async () => {
    resetFiles({
      'test.json': '{}',
    });
    expect(
      ensureDirectoryExists(join(outputDir, 'sub', 'dir', 'test.json')),
    ).rejects.toThrow('c');
  });
});

describe('logMultipleFileResults', () => {
  let logs: string[];
  const setupConsole = async () => {
    logs = [];
    mockConsole(msg => logs.push(msg));
  };
  const teardownConsole = async () => {
    logs = [];
    unmockConsole();
  };

  beforeEach(async () => {
    logs = [];
    setupConsole();
  });

  afterEach(() => {
    teardownConsole();
  });

  it('should log reports correctly`', async () => {
    logMultipleFileResults(
      [{ status: 'fulfilled', value: ['out.json'] }],
      'Uploaded reports',
    );
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('Uploaded reports successfully: ');
    expect(logs[1]).toContain('- [1mout.json[22m');
  });

  it('should log report sizes correctly`', async () => {
    logMultipleFileResults(
      [{ status: 'fulfilled', value: ['out.json', 10000] }],
      'Generated reports',
    );
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('Generated reports successfully: ');
    expect(logs[1]).toContain('- [1mout.json[22m ([90m9.77 kB[39m)');
  });

  it('should log fails correctly`', async () => {
    logMultipleFileResults(
      [{ status: 'rejected', reason: 'fail' }],
      'Generated reports',
    );
    expect(logs).toHaveLength(2);

    expect(logs).toContain('Generated reports failed: ');
    expect(logs).toContain('- [1mfail[22m');
  });

  it('should log report sizes and fails correctly`', async () => {
    logMultipleFileResults(
      [
        { status: 'fulfilled', value: ['out.json', 10000] },
        { status: 'rejected', reason: 'fail' },
      ],
      'Generated reports',
    );
    expect(logs).toHaveLength(4);
    expect(logs).toContain('Generated reports successfully: ');
    expect(logs).toContain('- [1mout.json[22m ([90m9.77 kB[39m)');

    expect(logs).toContain('Generated reports failed: ');
    expect(logs).toContain('- [1mfail[22m');
  });
});
