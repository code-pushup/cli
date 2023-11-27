import { unlink } from 'fs/promises';
import { vol } from 'memfs';
import { join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import { multiPackageFileStructure } from '../../mocks';
import { RequiredDependencies } from './dependencies.audit';
import { runnerFunction } from './package-json.plugin';

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
// default deps all packages pass
const deps: RequiredDependencies = {
  dependencies: {
    lib1: '0.0.0',
  },
};

describe('runnerFunction', () => {
  const runner = async (requiredDependencies: RequiredDependencies = deps) => {
    const r = await runnerFunction({
      directory: outputDir,
      requiredDependencies,
    });
    return r(() => void 0);
  };
  const packageJsonAuditOutputBase = {
    slug: 'package-version-check',
    score: 1,
    value: 0,
    displayValue: '0 packages',
  };

  beforeEach(() => {
    vol.reset();
    vol.fromJSON(multiPackageFileStructure, outputDir);
  });

  it('should return passed audit if no package.json files are given', async () => {
    vol.reset();
    // create empty directory
    vol.fromJSON(
      {
        'm.js': '',
      },
      outputDir,
    );
    await unlink(join(outputDir, 'm.js'));
    await expect(runner()).resolves.toEqual([packageJsonAuditOutputBase]);
  });

  it('should return issues if files are given and pass', async () => {
    await expect(runner()).resolves.toEqual([
      expect.objectContaining({
        ...packageJsonAuditOutputBase,
        details: {
          issues: expect.any(Array),
        },
      }),
    ]);
  });

  it('should have number of files 0 as value if all packages are valid', async () => {
    await expect(runner()).resolves.toEqual([
      expect.objectContaining({
        ...packageJsonAuditOutputBase,
        displayValue: '0 packages',
        value: 0,
        details: {
          issues: expect.any(Array),
        },
      }),
    ]);
  });

  it('should have number of files as value if packages are invalid', async () => {
    await expect(
      runner({
        dependencies: {
          lib1: '0.0.1',
        },
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        ...packageJsonAuditOutputBase,
        displayValue: '3 packages',
        score: 0,
        value: 3,
        details: {
          issues: expect.any(Array),
        },
      }),
    ]);
  });
});
