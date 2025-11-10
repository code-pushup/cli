import { bold } from 'ansis';
import { vol } from 'memfs';
import { describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  cleanTestFolder,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from './test-folder-setup.js';

describe('restoreNxIgnoredFiles', () => {
  it('should rename Nx ignored files target folder and keep the rest unchanged', async () => {
    vol.fromJSON(
      {
        '/_nx.json': '',
        '/_package.json': '',
        '/_project.json': '',
        '/projects/lib1/_package.json': '',
        '/projects/lib1/_project.json': '',
        '/projects/lib2/_package.json': '',
        '/projects/lib2/_project.json': '',
      },
      MEMFS_VOLUME,
    );

    await expect(restoreNxIgnoredFiles('/')).resolves.not.toThrow();

    expect(vol.toJSON()).toStrictEqual({
      '/nx.json': '',
      '/package.json': '',
      '/project.json': '',
      '/projects/lib1/package.json': '',
      '/projects/lib1/project.json': '',
      '/projects/lib2/package.json': '',
      '/projects/lib2/project.json': '',
    });
  });

  it('should rename Nx ignored files in a folder', async () => {
    vol.fromJSON(
      {
        '/_nx.json': '',
        '/_package.json': '',
        '/_project.json': '',
      },
      MEMFS_VOLUME,
    );

    await expect(restoreNxIgnoredFiles('/')).resolves.not.toThrow();

    expect(vol.toJSON()).toStrictEqual({
      '/nx.json': '',
      '/package.json': '',
      '/project.json': '',
    });
  });

  it('should throw if target folder does not exist', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    await expect(restoreNxIgnoredFiles('/non-existent')).rejects.toThrow(
      "ENOENT: no such file or directory, readdir '/non-existent'",
    );
  });

  it('should rename Nx ignored files in nested folders', async () => {
    vol.fromJSON(
      {
        '/workspaces/workspace1/_nx.json': '',
        '/workspaces/workspace1/_package.json': '',
        '/workspaces/workspace1/lib1/_project.json': '',
      },
      MEMFS_VOLUME,
    );

    await expect(restoreNxIgnoredFiles('/')).resolves.not.toThrow();

    expect(vol.toJSON()).toStrictEqual({
      '/workspaces/workspace1/nx.json': '',
      '/workspaces/workspace1/package.json': '',
      '/workspaces/workspace1/lib1/project.json': '',
    });
  });
});

describe('cleanTestFolder', () => {
  it('should clean and create a test folder', async () => {
    vol.fromJSON(
      {
        '/tmp/unit/package.json': '',
      },
      MEMFS_VOLUME,
    );

    await expect(cleanTestFolder('/tmp/unit')).resolves.not.toThrow();

    expect(vol.toJSON()).toStrictEqual({
      '/tmp/unit': null,
    });
  });
});

describe('teardownTestFolder', () => {
  it('should handle non-existent folder', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    await expect(teardownTestFolder('/tmp/unit')).resolves.not.toThrow();

    expect(vol.toJSON()).toStrictEqual({});
  });

  it('should delete existing directory', async () => {
    vol.fromJSON(
      {
        '/tmp/unit/package.json': '',
        '/tmp/unit/src/index.ts': '',
        '/tmp/unit/README.md': '',
      },
      MEMFS_VOLUME,
    );

    await expect(teardownTestFolder('/tmp/unit')).resolves.toEqual(undefined);

    // memfs represents empty directories as null, so /tmp remains as null after deletion
    expect(vol.toJSON()).toStrictEqual({
      '/tmp': null,
    });
  });

  it('should warn when path is a file instead of directory', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vol.fromJSON(
      {
        '/tmp/unit/package.json': '',
      },
      MEMFS_VOLUME,
    );

    await expect(teardownTestFolder('/tmp/unit/package.json')).resolves.toEqual(
      undefined,
    );

    expect(vol.toJSON()).toStrictEqual({
      '/tmp/unit': null,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      `⚠️ You are trying to delete a file instead of a directory - ${bold('/tmp/unit/package.json')}.`,
    );
  });
});
