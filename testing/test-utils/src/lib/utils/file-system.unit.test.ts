import { vol } from 'memfs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { ensureDirectoryExists } from './file-system';

describe('ensureDirectoryExists', () => {
  it('should create a nested folder', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    const dir = join(MEMFS_VOLUME, 'sub', 'dir');

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

    const dir = join(MEMFS_VOLUME, 'sub');

    await ensureDirectoryExists(dir);
    await expect(
      stat(dir).then(stats => stats.isDirectory()),
    ).resolves.toBeTruthy();
  });
});
