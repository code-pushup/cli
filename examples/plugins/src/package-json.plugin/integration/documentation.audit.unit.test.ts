import { describe, expect, it } from 'vitest';
import { AuditOutput } from '@code-pushup/models';
import {
  packageJson,
  packageJsonName,
  packageResult,
} from '../../../mocks/constants';
import {
  documentationAudit,
  DocumentationOptions
} from './documentation.audit';

describe('packageNotInstalledIssue', () => {
  it.each([
    [packageJsonName, 'lib1', '*'],
    [packageJsonName, 'lib1', '^.0.0.0'],
    [packageJsonName, 'lib1', '0.0.0'],
  ])('should return correct issue', (file, packageName, targetVersion) => {
    expect(
      documentationAudit([packageResult(packageJson)], {description: true}),
    ).toEqual({
      message: `docs1`,
      severity: 'error',
      source: {
        file,
      },
    });
  });
});

describe('documentation', () => {
  it('should pass if docs ok', () => {
    const packageName = 'lib1';
    expect(
      assertDependency(
        packageResult(packageJson),
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
          startLine: 3,
        },
      },
    });
  });
});

describe('documentationAudit', () => {
  const baseAuditOutput: AuditOutput = {
    slug: 'package-documentation',
    score: 1,
    value: 0,
    displayValue: '0 packages',
  };

  it('should list valid dependencies as informative issue', async () => {
    const packageName = 'lib1';
    const targetVersion = '0.0.0';
    await expect(
      documentationAudit([packageResult(packageJson)], {
        description: true,
      }),
    ).resolves.toEqual(
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
