import {describe, expect, it} from 'vitest';
import {packageResult,} from '../../../mocks/constants';
import {typeAudit,} from './type.audit';


describe('typeAudit', () => {
  it('should pass if not configured', () => {
    expect(
      typeAudit([packageResult({
        type: 'MIT'
      })], undefined),
    ).toEqual({
      "displayValue": "No type required",
      "score": 1,
      "slug": "package-type",
      "value": 0,
    });
  });

  it.each([
    [undefined],
    ['']
  ])('should sserror for %s', (type) => {
    const targetPackageJson = type ? {
      type
    } : {};
    expect(
      typeAudit([packageResult(targetPackageJson)], 'CommonJS')
    ).toEqual({
      displayValue: "1 package",
      score: 0,
      slug: "package-type",
      value: 1,
      details: {
        issues: [
          {
            message: `type should be CommonJS but is ${type || 'undefined'}`,
            severity: "error",
            source: {
              position: {
                startLine: null,
              },
              file: "package.json"
            }
          }
        ]
      }
    })
    ;
  });

  it('should error for different type', () => {
    const targetPackageJson = {
      type: 'WTF'
    };
    expect(
      typeAudit([packageResult(targetPackageJson)], 'Esm')
    ).toEqual({
      displayValue: "1 package",
      score: 0,
      slug: "package-type",
      value: 1,
      details: {
        issues: [
          {
            message: `type should be Esm but is ${targetPackageJson.type}`,
            severity: "error",
            source: {
              file: "package.json",
              position: {
                startLine: 1,
              },
            }
          }
        ]
      }
    })
    ;
  });

});
