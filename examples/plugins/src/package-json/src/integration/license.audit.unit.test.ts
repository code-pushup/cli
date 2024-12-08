import { describe, expect, it } from 'vitest';
import { packageResult } from '../../../../mocks/constants.js';
import { licenseAudit } from './license.audit.js';

describe('licenseAudit', () => {
  it('should pass if not configured', () => {
    expect(
      licenseAudit(
        [
          packageResult({
            license: 'MIT',
          }),
        ],
        undefined,
      ),
    ).toEqual({
      displayValue: 'No license required',
      score: 1,
      slug: 'package-license',
      value: 0,
    });
  });

  it('should error for undefined', () => {
    const targetPackageJson = {};
    expect(
      licenseAudit([packageResult(targetPackageJson)], 'ANY-LICENSE'),
    ).toEqual({
      displayValue: '1 package',
      score: 0,
      slug: 'package-license',
      value: 1,
      details: {
        issues: [
          {
            message: 'license should be ANY-LICENSE but is undefined',
            severity: 'error',
          },
        ],
      },
    });
  });

  it('should error for ""', () => {
    const targetPackageJson = { license: '' };
    expect(
      licenseAudit([packageResult(targetPackageJson)], 'ANY-LICENSE'),
    ).toEqual({
      displayValue: '1 package',
      score: 0,
      slug: 'package-license',
      value: 1,
      details: {
        issues: [
          {
            message: 'license should be ANY-LICENSE but is ',
            severity: 'error',
          },
        ],
      },
    });
  });

  it('should error for different license', () => {
    const targetPackageJson = {
      license: 'WTF',
    };
    expect(licenseAudit([packageResult(targetPackageJson)], 'MIT')).toEqual({
      displayValue: '1 package',
      score: 0,
      slug: 'package-license',
      value: 1,
      details: {
        issues: [
          {
            message: `license should be MIT but is ${targetPackageJson.license}`,
            severity: 'error',
          },
        ],
      },
    });
  });
});
