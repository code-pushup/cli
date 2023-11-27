import { vol } from 'memfs';
import { join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/testing-utils';
import {
  multiPackageFileStructure,
  packageJson,
  packageJsonContent,
  packageJsonName,
} from '../../mocks';
import {
  DependencyTypes,
  RequiredDependencies,
  assertDependency,
  dependenciesAudit,
  packageNotInstalledIssue,
} from './dependencies.audit';

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

describe('packageNotInstalledIssue', () => {
  it.each([
    [packageJsonName, 'lib1', '*'],
    [packageJsonName, 'lib1', '^.0.0.0'],
    [packageJsonName, 'lib1', '0.0.0'],
  ])('should return correct issue', (file, packageName, targetVersion) => {
    expect(
      packageNotInstalledIssue({ file }, [packageName, targetVersion]),
    ).toEqual({
      message: `Package ${packageName} is not installed. Run \`npm install ${packageName}@${targetVersion}\` to install it.`,
      severity: 'error',
      source: {
        file,
      },
    });
  });
});

describe('assertPackageVersion', () => {
  it('should pass if version ok', () => {
    const packageName = 'lib1';
    expect(
      assertDependency(
        {
          file: packageJsonName,
          content: packageJsonContent,
          json: packageJson,
        },
        [packageName, '1'],
        'dependencies',
      ),
    ).toEqual({
      message: `Package ${packageName}@1 is installed as dependencies.`,
      severity: 'info',
      source: {
        file: packageJsonName,
      },
    });
  });

  it('should error if version different', () => {
    const packageName = 'lib1';
    expect(
      assertDependency(
        {
          file: packageJsonName,
          content: packageJsonContent,
          json: packageJson,
        },
        [packageName, '0.0.1'],
        'dependencies',
      ),
    ).toEqual({
      message: `Package ${packageName} in dependencies has wrong version. Wanted 0.0.1 but got 0.0.0`,
      severity: 'error',
      source: {
        file: packageJsonName,
        position: {
          startLine: 3,
        },
      },
    });
  });
});

describe('dependenciesAudit', () => {
  const packageResults = [
    {
      file: packageJsonName,
      content: packageJsonContent,
      json: JSON.parse(packageJsonContent),
    },
    {
      file: packageJsonName,
      content: packageJsonContent,
      json: JSON.parse(packageJsonContent),
    },
    {
      file: packageJsonName,
      content: packageJsonContent,
      json: JSON.parse(packageJsonContent),
    },
  ];
  beforeEach(() => {
    vol.reset();
    vol.fromJSON(multiPackageFileStructure, outputDir);
  });

  it('should list all package.json files', async () => {
    await expect(dependenciesAudit(packageResults, deps)).resolves.toEqual(
      ['package.json', 'package.json', 'package.json'].map(file =>
        expect.objectContaining({
          message: expect.any(String),
          severity: expect.any(String),
          source: {
            file: expect.stringContaining(file),
          },
        }),
      ),
    );
  });

  it('should list files in a leave directory', async () => {
    await expect(dependenciesAudit(packageResults, deps)).resolves.toEqual([
      {
        message: expect.any(String),
        severity: expect.any(String),
        source: {
          file: expect.stringContaining(join('pkg-1', packageJsonName)),
        },
      },
    ]);
  });

  it('should list valid dependencies as informative issue', async () => {
    const dependencyType: DependencyTypes = 'dependencies';
    const packageName = 'lib1';
    const targetVersion = '0.0.0';
    await expect(
      dependenciesAudit(packageResults, {
        dependencies: {
          [packageName]: targetVersion,
        },
      }),
    ).resolves.toEqual([
      {
        message: `Package ${packageName}@${targetVersion} is installed as ${dependencyType}.`,
        severity: 'info',
        source: {
          file: expect.stringContaining(packageJsonName),
        },
      },
    ]);
  });

  it('should list invalid dependencies as error issue including startLine position', async () => {
    const dependencyType: DependencyTypes = 'dependencies';
    const packageName = 'lib1';
    const targetVersion = '0.0.1';
    await expect(
      dependenciesAudit(packageResults, {
        dependencies: {
          [packageName]: targetVersion,
        },
      }),
    ).resolves.toEqual([
      {
        message: `Package ${packageName} in ${dependencyType} has wrong version. Wanted ${targetVersion} but got 0.0.0`,
        severity: 'error',
        source: {
          file: expect.stringContaining(packageJsonName),
          position: {
            startLine: 3,
          },
        },
      },
    ]);
  });
});
