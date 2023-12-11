import { describe, expect, it } from 'vitest';
import { AuditOutput } from '@code-pushup/models';
import { packageJson, packageJsonName, packageResult } from '../../../../mocks';
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
      packageNotInstalledIssue(
        { file },
        [packageName, targetVersion],
        'dependencies',
      ),
    ).toEqual({
      message: `Package ${packageName} is not installed under dependencies. Run \`npm install ${packageName}@${targetVersion}\` to install it.`,
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
              message: `Package ${packageName}@${targetVersion} is installed as dependencies.`,
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

  it('should list valid dependencies of multiple sections as informative issue', () => {
    const deps = {
      dependencies: {
        foo: '0.0.0',
      },
      devDependencies: {
        bar: '0.0.0-alpha',
      },
      optionalDependencies: {
        baz: '0.0.0-alpha.0',
      },
    };
    expect(
      dependenciesAudit(
        [
          packageResult({
            ...deps,
            dependencies: {
              ...deps.dependencies,
              foo2: '0.0.1',
            },
          }),
        ],
        deps,
      ),
    ).toEqual(
      expect.objectContaining({
        ...baseAuditOutput,
        details: {
          issues: [
            {
              message: expect.stringMatching(/^(?=.*foo)(?=.*dependencies).*/),

              severity: 'info',
              source: expect.any(Object),
            },
            {
              message: expect.stringMatching(
                /^(?=.*bar)(?=.*devDependencies).*/,
              ),

              severity: 'info',
              source: expect.any(Object),
            },
            {
              message: expect.stringMatching(
                /^(?=.*baz)(?=.*optionalDependencies).*/,
              ),
              severity: 'info',
              source: expect.any(Object),
            },
          ],
        },
      }),
    );
  });

  it('should list invalid dependencies as error issue', () => {
    const packageName = 'lib1';
    const targetVersion = '0.0.1';
    expect(
      dependenciesAudit([packageResult(packageJson)], {
        dependencies: {
          [packageName]: targetVersion,
        },
      }),
    ).toEqual(
      expect.objectContaining({
        slug: baseAuditOutput.slug,
        score: 0,
        value: 1,
        displayValue: '1 package',
        details: {
          issues: [
            {
              message:
                'Package lib1 in dependencies has wrong version. Wanted 0.0.1 but got 0.0.0',
              severity: 'error',
              source: {
                file: 'package.json',
                position: {
                  startLine: 1,
                },
              },
            },
          ],
        },
      }),
    );
  });

  it('should list valid dependencies of multiple sections as error issue', () => {
    const deps = {
      dependencies: {
        foo: '0.0.0',
      },
      devDependencies: {
        bar: '0.0.0-alpha',
      },
      optionalDependencies: {
        baz: '0.0.0-alpha.0',
      },
    };
    expect(
      dependenciesAudit(
        [
          packageResult({
            dependencies: {
              foo: '0.0.1',
            },
            devDependencies: {
              bar: '0.0.1-alpha',
            },
            optionalDependencies: {
              baz: '0.0.0-alpha.1',
            },
          }),
        ],
        deps,
      ),
    ).toEqual(
      expect.objectContaining({
        slug: baseAuditOutput.slug,
        score: 0,
        value: 3,
        displayValue: '3 packages',
        details: {
          issues: [
            {
              message: expect.stringMatching(/^(?=.*foo)(?=.*dependencies).*/),

              severity: 'error',
              source: expect.any(Object),
            },
            {
              message: expect.stringMatching(
                /^(?=.*bar)(?=.*devDependencies).*/,
              ),

              severity: 'error',
              source: expect.any(Object),
            },
            {
              message: expect.stringMatching(
                /^(?=.*baz)(?=.*optionalDependencies).*/,
              ),
              severity: 'error',
              source: expect.any(Object),
            },
          ],
        },
      }),
    );
  });
});
