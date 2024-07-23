import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as utils from '@code-pushup/utils';
import { derivePackageManager } from './utils';

describe('derivePackageManager', () => {
  const fileExistsSpy = vi.spyOn(utils, 'fileExists');

  beforeEach(() => {
    fileExistsSpy.mockResolvedValue(false);
  });
  afterEach(() => {
    fileExistsSpy.mockReset();
  });

  it('should fall back to NPM if neither filesystem nor env shows hints', async () => {
    await expect(derivePackageManager()).resolves.toBe('npm');
  });

  it('should return npm if a package.jock.json is present', async () => {
    fileExistsSpy.mockImplementation(path => Promise.resolve(path.endsWith('package-lock.json')));
    await expect(derivePackageManager()).resolves.toBe('npm');
  });

  it('should return pnpm if pnpm-lock.yaml is present', async () => {
    fileExistsSpy.mockImplementation(path => Promise.resolve(path.endsWith('pnpm-lock.yaml')));
    await expect(derivePackageManager()).resolves.toBe('pnpm');
  });

  it('should return yarn-classic if yarn.lock is present', async () => {
    fileExistsSpy.mockImplementation(path => Promise.resolve(path.endsWith('yarn.lock')));
    await expect(derivePackageManager()).resolves.toBe('yarn-classic');
  });

  it('should return yarn-modern if yarn.lock and .yarnrc.yml is present', async () => {
    fileExistsSpy.mockImplementation(path => Promise.resolve(path.endsWith('yarn.lock') || path.endsWith('.yarnrc.yml')));
    await expect(derivePackageManager()).resolves.toBe('yarn-modern');
  });
});
