import { stat } from 'fs/promises';
import { vol } from 'memfs';
import { join } from 'path';
import process from 'process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/models/testing';
import { mockConsole, unmockConsole } from '../../test/console.mock';
import {
  NoExportError,
  ensureDirectoryExists,
  importEsmModule,
  logMultipleFileResults,
  toUnixPath,
} from './file-system';

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
