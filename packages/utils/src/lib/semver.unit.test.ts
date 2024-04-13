import { validate } from 'compare-versions';
import { describe, expect, it } from 'vitest';
import { isSemver, normalizeSemver, sortSemvers } from './semver';

describe('semver-compare validate', () => {
  it.each([
    ['v0'],
    ['0'],
    ['0.0'],
    ['00.00.00'],
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
  ])('should match on a valid semver string: %s', versionString => {
    expect(validate(versionString)).toBeTruthy();
  });

  it.each([
    ['V0'],
    ['package@1.2.3-alpha'],
    ['11.22+33-alpha.4'], // (wrong patch separator)
    ['11.22.33-alpha?4'], // (wrong prerelease separator)
    ['package-1.2.3-alpha.0'], // (wrong as no @ for prefix)
    ['package-11.22.33-alpha.0'], //(wrong package separator)
  ])('should not match on a invalid semver string: %s', versionString => {
    expect(validate(versionString)).toBeFalsy();
  });
});

describe('isSemver', () => {
  it.each([
    ['v0.0.0'], // (valid as v is removed before check)
    ['V0.0.0'], // (valid as V is removed before check)
    ['package@1.2.3-alpha'], // (valid as everything before "@" is removed before check)
    ['0'],
    ['0.0'],
    ['00.00.00'],
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
  it.each([['0.0.0'], ['v0.0.0'], ['V0.0.0'], ['core@0.0.0']])(
    'should return normalized semver string: %s',
    versionString => {
      expect(normalizeSemver(versionString)).toBe('0.0.0');
    },
  );
});

describe('sortSemvers', () => {
  it.each([
    [['0.0.0', '0.0.1']],
    [['v0.0.0', 'core@0.0.1']],
    [['0.0.0-alpha.0', '0.0.1-alpha.0']],
    [['0.0.0-alpha.0', '0.0.1']],
  ])('should return normalized semver string: %s', semvers => {
    expect(sortSemvers(semvers)).toStrictEqual([
      expect.stringContaining('0.0.1'),
      expect.stringContaining('0.0.0'),
    ]);
  });
});
