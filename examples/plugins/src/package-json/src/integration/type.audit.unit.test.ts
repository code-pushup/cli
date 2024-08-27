import { describe, expect, it } from 'vitest';
import { packageResult } from '../../../../mocks/constants';
import { typeAudit } from './type.audit';
import type { PackageJson } from './types';

describe('typeAudit', () => {
  it('should pass if not configured', () => {
    expect(
      typeAudit(
        [
          packageResult({
            type: 'module',
          }),
        ],
        undefined,
      ),
    ).toEqual({
      displayValue: 'No type required',
      score: 1,
      slug: 'package-type',
      value: 0,
    });
  });

  it('should pass for module and type configured as module', () => {
    expect(
      typeAudit(
        [
          packageResult({
            type: 'module',
          }),
        ],
        'module',
      ),
    ).toEqual({
      displayValue: '0 packages',
      score: 1,
      slug: 'package-type',
      value: 0,
      details: {
        issues: [
          {
            message: 'Type is module',
            severity: 'info',
          },
        ],
      },
    });
  });

  it('should pass for commonjs and type configured as commonjs', () => {
    expect(
      typeAudit(
        [
          packageResult({
            type: 'commonjs',
          }),
        ],
        'commonjs',
      ),
    ).toEqual({
      displayValue: '0 packages',
      score: 1,
      slug: 'package-type',
      value: 0,
      details: {
        issues: [
          {
            message: 'Type is commonjs',
            severity: 'info',
          },
        ],
      },
    });
  });

  it('should pass for undefined and type is commonjs', () => {
    expect(typeAudit([packageResult({})], 'commonjs')).toEqual({
      displayValue: '0 packages',
      score: 1,
      slug: 'package-type',
      value: 0,
      details: {
        issues: [
          {
            message: 'Type is undefined. Defaults to commonjs.',
            severity: 'info',
          },
        ],
      },
    });
  });

  it('should error for empty string if type is commonjs', () => {
    const targetPackageJson = { type: '' } as unknown as PackageJson;
    expect(typeAudit([packageResult(targetPackageJson)], 'commonjs')).toEqual({
      displayValue: '1 package',
      score: 0,
      slug: 'package-type',
      value: 1,
      details: {
        issues: [
          {
            message: 'type should be undefined or commonjs but is ',
            severity: 'error',
          },
        ],
      },
    });
  });

  it('should error for undefined and type is module', () => {
    const targetPackageJson = {};
    expect(typeAudit([packageResult(targetPackageJson)], 'module')).toEqual({
      displayValue: '1 package',
      score: 0,
      slug: 'package-type',
      value: 1,
      details: {
        issues: [
          {
            message: 'type should be module but is undefined',
            severity: 'error',
          },
        ],
      },
    });
  });

  it('should error for empty string if type is module', () => {
    const targetPackageJson = { type: '' } as unknown as PackageJson;
    expect(typeAudit([packageResult(targetPackageJson)], 'module')).toEqual({
      displayValue: '1 package',
      score: 0,
      slug: 'package-type',
      value: 1,
      details: {
        issues: [
          {
            message: 'type empty',
            severity: 'error',
          },
        ],
      },
    });
  });

  it('should error for different type', () => {
    const targetPackageJson = {
      type: 'WTF',
    } as unknown as PackageJson;
    expect(typeAudit([packageResult(targetPackageJson)], 'module')).toEqual({
      displayValue: '1 package',
      score: 0,
      slug: 'package-type',
      value: 1,
      details: {
        issues: [
          {
            message: `type should be module but is ${targetPackageJson.type}`,
            severity: 'error',
          },
        ],
      },
    });
  });
});
