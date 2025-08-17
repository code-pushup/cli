import { vol } from 'memfs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import {
  type MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { MEMFS_VOLUME } from '../constants.js';
import { ensureDirectoryExists } from './file-system.js';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

describe('ensureDirectoryExists', () => {
  let cwdSpy: MockInstance<[], string>;

  beforeEach(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
  });

  it('should create a nested folder', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    const dir = path.join(MEMFS_VOLUME, 'sub', 'dir');

    await ensureDirectoryExists(dir);
    await expect(
      stat(dir).then(stats => stats.isDirectory()),
    ).resolves.toBeTruthy();
  });

  it('should pass if folder exists', async () => {
    vol.fromJSON(
      {
        'sub/file.txt': 'content',
      },
      MEMFS_VOLUME,
    );

    const dir = path.join(MEMFS_VOLUME, 'sub');

    await ensureDirectoryExists(dir);
    await expect(
      stat(dir).then(stats => stats.isDirectory()),
    ).resolves.toBeTruthy();
  });
});
