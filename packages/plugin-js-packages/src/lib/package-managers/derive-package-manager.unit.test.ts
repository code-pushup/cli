import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import {
  derivePackageManager,
  derivePackageManagerInPackageJson,
} from './derive-package-manager';
import * as deriveYarn from './derive-yarn';

describe('derivePackageManagerInPackageJson', () => {
  const fileExistsSpy = vi.spyOn(utils, 'fileExists');
  const executeProcessSpy = vi.spyOn(utils, 'executeProcess');

  beforeEach(() => {
    fileExistsSpy.mockClear();
    executeProcessSpy.mockClear();
  });
  afterAll(() => {
    executeProcessSpy.mockRestore();
  });

  it('should return npm if packageManager field in package.json is npm', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          packageManager:
            'npm@1.2.3+sha224.953c8233f7a92884eee2de69a1b92d1f2ec1655e66d08071ba9a02fa',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(derivePackageManagerInPackageJson()).resolves.toBe('npm');
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
    );
    expect(executeProcessSpy).toHaveBeenCalledTimes(0);
  });

  it('should return pnpm if packageManager field in package.json is pnpm', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          packageManager:
            'pnpm@3.2.3+sha224.953c8233f7a92884eee2de69a1b92d1f2ec1655e66d08071ba9a02fa',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(derivePackageManagerInPackageJson()).resolves.toBe('pnpm');
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
    );
    expect(executeProcessSpy).toHaveBeenCalledTimes(0);
  });

  it('should return yarn-classic if packageManager field in package.json is yarn v1', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          packageManager:
            'yarn@1.2.3+sha224.953c8233f7a92884eee2de69a1b92d1f2ec1655e66d08071ba9a02fa',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(derivePackageManagerInPackageJson()).resolves.toBe(
      'yarn-classic',
    );
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
    );
    expect(executeProcessSpy).toHaveBeenCalledTimes(0);
  });

  it('should return yarn-modern if packageManager field in package.json is yarn v2 or v3', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          packageManager:
            'yarn@2.2.3+sha224.953c8233f7a92884eee2de69a1b92d1f2ec1655e66d08071ba9a02fa',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(derivePackageManagerInPackageJson()).resolves.toBe(
      'yarn-modern',
    );
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
    );
    expect(executeProcessSpy).toHaveBeenCalledTimes(0);
  });
});

describe('derivePackageManager', () => {
  const fileExistsSpy = vi.spyOn(utils, 'fileExists');
  const deriveYarnVersionSpy = vi.spyOn(deriveYarn, 'deriveYarnVersion');

  beforeEach(() => {
    fileExistsSpy.mockClear();
    deriveYarnVersionSpy.mockClear();
  });
  afterAll(() => {
    fileExistsSpy.mockRestore();
    deriveYarnVersionSpy.mockRestore();
  });

  it('should return packageManager from field in package.json', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          packageManager:
            'pnpm@3.2.3+sha224.953c8233f7a92884eee2de69a1b92d1f2ec1655e66d08071ba9a02fa',
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(derivePackageManager()).resolves.toBe('pnpm');
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
    );
    expect(deriveYarnVersionSpy).not.toHaveBeenCalled();
  });

  it('should return npm if a package.jock.json is present', async () => {
    vol.fromJSON(
      {
        'package-lock.json': '{}',
      },
      MEMFS_VOLUME,
    );
    await expect(derivePackageManager()).resolves.toBe('npm');
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('package-lock.json'),
    );
    expect(deriveYarnVersionSpy).not.toHaveBeenCalled();
  });

  it('should return pnpm if pnpm-lock.yaml is present', async () => {
    vol.fromJSON(
      {
        'pnpm-lock.yaml': '',
      },
      MEMFS_VOLUME,
    );
    await expect(derivePackageManager()).resolves.toBe('pnpm');
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('pnpm-lock.yaml'),
    );
    expect(deriveYarnVersionSpy).not.toHaveBeenCalled();
  });

  it('should return yarn-classic if yarn.lock is present and yarn derives successfully', async () => {
    vol.fromJSON(
      {
        'yarn.lock': '',
      },
      MEMFS_VOLUME,
    );
    deriveYarnVersionSpy.mockResolvedValue('yarn-classic');

    await expect(derivePackageManager()).resolves.toBe('yarn-classic');
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('yarn.lock'),
    );
    expect(deriveYarnVersionSpy).toHaveBeenCalledTimes(1);
    expect(deriveYarnVersionSpy).toHaveBeenCalledWith();
  });

  it('should report error if neither filesystem nor env shows hints', async () => {
    await expect(derivePackageManager()).rejects.toThrow(
      'Could not detect package manager. Please provide it in the js-packages plugin config.',
    );
    expect(fileExistsSpy).toHaveBeenCalledWith(
      expect.stringContaining('package-lock.json'),
    );
  });
});
