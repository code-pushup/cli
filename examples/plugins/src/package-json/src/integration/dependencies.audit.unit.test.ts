import { describe, expect, it } from 'vitest';
import { AuditOutput } from '@code-pushup/models';
import {
  packageJson,
  packageJsonName,
  packageResult,
} from '../../../../mocks/constants';
import {
  assertDependency,
  dependenciesAudit,
  packageNotInstalledIssue,
} from './dependencies.audit';

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
        packageResult(packageJson),
        [packageName, '0.0.0'],
        'dependencies',
      ),
    ).toEqual({
      message: `Package ${packageName}@0.0.0 is installed as dependencies.`,
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
        packageResult(packageJson),
        [packageName, '0.0.1'],
        'dependencies',
      ),
    ).toEqual({
      message: `Package ${packageName} in dependencies has wrong version. Wanted 0.0.1 but got 0.0.0`,
      severity: 'error',
      source: {
        file: packageJsonName,
        position: {
          startLine: 1,
        },
      },
    });
  });
});

describe('dependenciesAudit', () => {
  const baseAuditOutput: AuditOutput = {
    slug: 'package-dependencies',
    score: 1,
    value: 0,
    displayValue: '0 packages',
  };

  it('should list valid dependencies as informative issue', () => {
    const packageName = 'lib1';
    const targetVersion = '0.0.0';
    expect(
      dependenciesAudit([packageResult(packageJson)], {
        dependencies: {
          [packageName]: targetVersion,
        },
      }),
    ).toEqual(
      expect.objectContaining({
        ...baseAuditOutput,
        details: {
          issues: [
            {
              message: 'Package lib1@0.0.0 is installed as dependencies.',
              severity: 'info',
              source: {
                file: 'package.json',
              },
            },
          ],
        },
      }),
    );
  });
});
