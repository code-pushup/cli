import { vol } from 'memfs';
import { MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import {
  derivePackageManager,
  derivePackageManagerInPackageJson,
  deriveYarnVersion,
  normalizeConfig,
} from './utils';
import {ProcessConfig, ProcessResult} from "@code-pushup/utils";

describe('normalizeConfig', () => {
  it('should return checks object', async () => {
    await expect(
      normalizeConfig({ packageManager: 'npm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        checks: ['audit', 'outdated'],
      }),
    );
  });

  it('should return depGroups object', async () => {
    await expect(
      normalizeConfig({ packageManager: 'npm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        depGroups: ['prod', 'dev'],
      }),
    );
  });

  it('should throw if no package manager is detected', async () => {
    await expect(normalizeConfig()).rejects.toThrow(
      'Could not detect package manager. Please provide in in the js-packages plugin config.',
    );
  });

  it('should return npm packageManager object if packageManager name is npm', async () => {
    await expect(
      normalizeConfig({ packageManager: 'npm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        packageManager: expect.objectContaining({
          slug: 'npm',
          command: 'npm',
          name: 'NPM',
        }),
      }),
    );
  });

  it('should return yarn-classic packageManager object if packageManager name is yarn-classic', async () => {
    await expect(
      normalizeConfig({ packageManager: 'yarn-classic' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        packageManager: expect.objectContaining({
          slug: 'yarn-classic',
          command: 'yarn',
          name: 'Yarn v1',
        }),
      }),
    );
  });

  it('should return yarn-modern packageManager object if packageManager name is yarn-modern', async () => {
    await expect(
      normalizeConfig({ packageManager: 'yarn-modern' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        packageManager: expect.objectContaining({
          slug: 'yarn-modern',
          command: 'yarn',
          name: 'yarn-modern',
        }),
      }),
    );
  });

  it('should return pnpm packageManager object if packageManager name is pnpm', async () => {
    await expect(
      normalizeConfig({ packageManager: 'pnpm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        packageManager: expect.objectContaining({
          slug: 'pnpm',
          command: 'pnpm',
          name: 'pnpm',
        }),
      }),
    );
  });
});

describe('deriveYarnVersion', () => {
  const executeProcessSpy = vi.spyOn(utils, 'executeProcess') as MockInstance<(c: ProcessConfig) => ProcessResult>;

  beforeEach(() => {
    executeProcessSpy.mockClear();
  });
  afterAll(() => {
    executeProcessSpy.mockRestore();
  });

  it('should return yarn-classic if and yarn v1 is installed', async () => {
    executeProcessSpy.mockImplementation((_, fn) => fn(null, '1.22.19'));

    await expect(deriveYarnVersion()).resolves.toBe('yarn-classic');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith('yarn -v', expect.any(Function));
  });

  it('should return yarn-modern  if and yarn v2 is installed', async () => {
    executeProcessSpy.mockImplementation((_, fn) => fn(null, '2.22.19'));

    await expect(deriveYarnVersion()).resolves.toBe('yarn-modern');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith('yarn -v', expect.any(Function));
  });

  it('should return yarn-modern  if and yarn v3 is installed', async () => {
    executeProcessSpy.mockImplementation((_, fn) => fn(null, '3.22.19'));

    await expect(deriveYarnVersion()).resolves.toBe('yarn-modern');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith('yarn -v', expect.any(Function));
  });

  it('should return false if yarn is NOT installed', async () => {
    executeProcessSpy.mockImplementation((_, fn) => fn(null, ''));

    await expect(deriveYarnVersion()).resolves.toBe(false);
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith('yarn -v', expect.any(Function));
  });
});

describe('derivePackageManagerInPackageJson', () => {
  const fileExistsSpy = vi.spyOn(utils, 'fileExists');
  const executeProcessSpy = vi.spyOn(utils, 'executeProcess') as MockInstance<(c: ProcessConfig) => ProcessResult>;

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
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/package.json');
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
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/package.json');
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
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/package.json');
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
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/package.json');
    expect(executeProcessSpy).toHaveBeenCalledTimes(0);
  });
});

describe('derivePackageManager', () => {
  const fileExistsSpy = vi.spyOn(utils, 'fileExists');
  const executeProcessSpy = vi.spyOn(utils, 'executeProcess') as MockInstance<(c: ProcessConfig) => ProcessResult>;

  beforeEach(() => {
    fileExistsSpy.mockClear();
    executeProcessSpy.mockClear();
  });
  afterAll(() => {
    executeProcessSpy.mockRestore();
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
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/package.json');
    expect(executeProcessSpy).toHaveBeenCalledTimes(0);
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
    expect(executeProcessSpy).not.toHaveBeenCalled();
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
    expect(executeProcessSpy).not.toHaveBeenCalled();
  });

  it('should return yarn-classic if yarn.lock is present and yarn is installed', async () => {
    vol.fromJSON(
      {
        'yarn.lock': '',
      },
      MEMFS_VOLUME,
    );
    executeProcessSpy.mockImplementation((_, fn) => fn(null, '1.22.19'));

    await expect(derivePackageManager()).resolves.toBe('yarn-classic');
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/yarn.lock');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith('yarn -v', expect.any(Function));
  });

  it('should fall back to npm if neither filesystem nor env shows hints', async () => {
    await expect(normalizeConfig()).rejects.toThrow(
      'Could not detect package manager. Please provide in in the js-packages plugin config.',
    );
    expect(fileExistsSpy).toHaveBeenCalledWith('/test/package-lock.json');
  });
});
