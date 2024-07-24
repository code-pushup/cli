import { vol } from 'memfs';
import { exec } from 'node:child_process';
import { MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import { derivePackageManager } from './utils';

vi.mock('child_process', () => {
  const actual = vi.importActual('child_process');
  return {
    ...actual,
    exec: vi.fn(),
  };
});

describe('derivePackageManager', () => {
  const fileExistsSpy = vi.spyOn(utils, 'fileExists');
  // const execSpy = vi.spyOn(child_process, 'exec');

  beforeEach(() => {
    fileExistsSpy.mockClear();
  });

  it('should return npm if a package.jock.json is present', async () => {
    vol.fromJSON(
      {
        'package-lock.json': '{}',
      },
      MEMFS_VOLUME,
    );
    await expect(derivePackageManager()).resolves.toBe('npm');
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/package-lock.json');
    expect(exec).not.toHaveBeenCalled();
  });

  it('should return pnpm if pnpm-lock.yaml is present', async () => {
    vol.fromJSON(
      {
        'pnpm-lock.yaml': '',
      },
      MEMFS_VOLUME,
    );
    await expect(derivePackageManager()).resolves.toBe('pnpm');
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/pnpm-lock.yaml');
    expect(exec).not.toHaveBeenCalled();
  });

  it('should return yarn-classic if yarn.lock is present', async () => {
    vol.fromJSON(
      {
        'yarn.lock': '',
      },
      MEMFS_VOLUME,
    );
    (exec as MockInstance).mockImplementation((_, fn) => fn(null, '1.22.19'));

    await expect(derivePackageManager()).resolves.toBe('yarn-classic');
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/yarn.lock');
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith('yarn -v', expect.any(Function));
  });

  it('should return yarn-modern if yarn version is 2', async () => {
    vol.fromJSON(
      {
        'yarn.lock': '',
      },
      MEMFS_VOLUME,
    );
    (exec as MockInstance).mockImplementation((_, fn) => fn(null, '2.22.19'));

    await expect(derivePackageManager()).resolves.toBe('yarn-modern');
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/yarn.lock');
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith('yarn -v', expect.any(Function));
  });

  it('should return yarn-modern if yarn version is 3', async () => {
    vol.fromJSON(
      {
        'yarn.lock': '',
      },
      MEMFS_VOLUME,
    );
    (exec as MockInstance).mockImplementation((_, fn) => fn(null, '3.22.19'));

    await expect(derivePackageManager()).resolves.toBe('yarn-modern');
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/yarn.lock');
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith('yarn -v', expect.any(Function));
  });

  it('should fall back to NPM if neither filesystem nor env shows hints', async () => {
    await expect(derivePackageManager()).resolves.toBe('npm');
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/package-lock.json');
  });
});
