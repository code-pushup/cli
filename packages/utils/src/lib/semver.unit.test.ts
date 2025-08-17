import { describe, expect, it } from 'vitest';
import { isSemver, normalizeSemver, sortSemvers } from './semver.js';

describe('isSemver', () => {
  it.each([
    ['v0.0.0'], // (valid as v is removed before check)
    ['V0.0.0'], // (valid as V is removed before check)
    ['package@1.2.3-alpha'], // (valid as everything before "@" is removed before check)
    ['0.0.0'],
    ['0.0.0-alpha'],
    ['0.0.0-alpha.0'],
    ['1.2.3'],
    ['11.22.33'],
    ['1.2.3-alpha'],
    ['11.22.33-alpha'],
    ['1.2.3-alpha.4'],
    ['11.22.33-alpha.4'],
    ['11.22.33-alpha-44'],
    ['1.2.3-alpha-4'],
    ['11.22.33+alpha.4'],
  ])('should return true for a valid semver string: %s', versionString => {
    expect(isSemver(versionString)).toBeTruthy();
  });

  it.each([
    ['11.22+33-alpha.4'],
    ['11.22.33-alpha?4'],
    ['package-1.2.3-alpha.0'], // (wrong as no @ for prefix)
    ['package-11.22.33-alpha.0'], //(wrong package separator)
  ])('should return false for a invalid semver string: s%', versionString => {
    expect(isSemver(versionString)).toBeFalsy();
  });
});

describe('normalizeSemver', () => {
  it.each([['1.0.0'], ['v1.0.0'], ['V1.0.0'], ['core@1.0.0']])(
    'should return normalized semver string: %s',
    versionString => {
      expect(normalizeSemver(versionString)).toBe('1.0.0');
    },
  );
});

describe('sortSemvers', () => {
  it.each([
    [['1.0.0', '1.0.1']],
    [['v1.0.0', 'core@1.0.1']],
    [['1.0.0-alpha.0', '1.0.1-alpha.0']],
    [['1.0.0-alpha.0', '1.0.1']],
  ])('should return normalized semver string: %s', semvers => {
    expect(sortSemvers(semvers)).toStrictEqual([
      expect.stringContaining('1.0.1'),
      expect.stringContaining('1.0.0'),
    ]);
  });
});
