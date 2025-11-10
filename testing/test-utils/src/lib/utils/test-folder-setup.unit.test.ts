import { bold } from 'ansis';
import { vol } from 'memfs';
import * as fsPromises from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  cleanTestFolder,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from './test-folder-setup.js';

describe('restoreNxIgnoredFiles', () => {
  it('should rename Nx ignored files in a folder', async () => {
    vol.fromJSON(
      {
        '/_nx.json': '{}',
        '/_package.json': '{}',
        '/_project.json': '{}',
      },
      MEMFS_VOLUME,
    );

    await expect(restoreNxIgnoredFiles('/')).resolves.not.toThrow();

    expect(vol.existsSync('/nx.json')).toBe(true);
    expect(vol.existsSync('/_nx.json')).toBe(false);
    expect(vol.existsSync('/package.json')).toBe(true);
    expect(vol.existsSync('/_package.json')).toBe(false);
    expect(vol.existsSync('/project.json')).toBe(true);
    expect(vol.existsSync('/_project.json')).toBe(false);
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
        '/workspaces/workspace1/_nx.json': '{}',
        '/workspaces/workspace1/_package.json': '{}',
        '/workspaces/workspace1/lib1/_project.json': '{}',
      },
      MEMFS_VOLUME,
    );

    await expect(restoreNxIgnoredFiles('/')).resolves.not.toThrow();

    expect(vol.existsSync('/workspaces/workspace1/nx.json')).toBe(true);
    expect(vol.existsSync('/workspaces/workspace1/_nx.json')).toBe(false);
    expect(vol.existsSync('/workspaces/workspace1/package.json')).toBe(true);
    expect(vol.existsSync('/workspaces/workspace1/_package.json')).toBe(false);
    expect(vol.existsSync('/workspaces/workspace1/lib1/project.json')).toBe(
      true,
    );
    expect(vol.existsSync('/workspaces/workspace1/lib1/_project.json')).toBe(
      false,
    );
  });
});

describe('cleanTestFolder', () => {
  it('should clean and create a test folder', async () => {
    vol.fromJSON(
      {
        '/tmp/unit/package.json': '{}',
      },
      MEMFS_VOLUME,
    );

    await expect(cleanTestFolder('/tmp/unit')).resolves.not.toThrow();

    expect(vol.existsSync('/tmp/unit')).toBe(true);
  });
});

describe('teardownTestFolder', () => {
  const statSpy = vi.spyOn(fsPromises, 'stat');
  const rmSpy = vi.spyOn(fsPromises, 'rm');

  it('should handle non-existent folder', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    statSpy.mockRejectedValue(new Error('ENOENT: no such file or directory'));

    await expect(teardownTestFolder('/tmp/unit')).resolves.not.toThrow();
  });

  it('should delete existing directory', async () => {
    statSpy.mockResolvedValue({
      isDirectory: () => true,
    } as Awaited<ReturnType<typeof fsPromises.stat>>);
    rmSpy.mockResolvedValue(undefined);

    await expect(teardownTestFolder('/tmp/unit')).resolves.toEqual(undefined);

    expect(statSpy).toHaveBeenCalledWith('/tmp/unit');
    expect(rmSpy).toHaveBeenCalledWith('/tmp/unit', {
      recursive: true,
      force: true,
      maxRetries: 2,
      retryDelay: 100,
    });
  });

  it('should warn when path is a file instead of directory', async () => {
    statSpy.mockResolvedValue({
      isDirectory: () => false,
    } as Awaited<ReturnType<typeof fsPromises.stat>>);
    rmSpy.mockResolvedValue(undefined);

    await expect(teardownTestFolder('/tmp/unit/package.json')).resolves.toEqual(
      undefined,
    );

    expect(statSpy).toHaveBeenCalledWith('/tmp/unit/package.json');
    expect(console.warn).toHaveBeenCalledWith(
      `⚠️ You are trying to delete a file instead of a directory - ${bold('/tmp/unit/package.json')}.`,
    );
  });

  it('should ignore stat failure', async () => {
    statSpy.mockResolvedValue({
      isDirectory: () => true,
    } as Awaited<ReturnType<typeof fsPromises.stat>>);

    await expect(teardownTestFolder('/tmp/unit')).resolves.toEqual(undefined);

    expect(statSpy).toHaveBeenCalledWith('/tmp/unit');
  });

  it('should handle deletion failure', async () => {
    statSpy.mockResolvedValue({
      isDirectory: () => true,
    } as Awaited<ReturnType<typeof fsPromises.stat>>);
    rmSpy.mockRejectedValue(new Error('Deletion failed'));

    await expect(teardownTestFolder('/tmp/unit')).resolves.toEqual(undefined);

    expect(statSpy).toHaveBeenCalledWith('/tmp/unit');
    expect(rmSpy).toHaveBeenCalledWith('/tmp/unit', {
      recursive: true,
      force: true,
      maxRetries: 2,
      retryDelay: 100,
    });
    expect(console.warn).toHaveBeenCalledWith(
      `⚠️ Failed to delete test artefact ${bold('/tmp/unit')} so the folder is still in the file system!\nIt may require a deletion before running e2e tests again.`,
    );
  });
});
