import { describe, expect, it } from 'vitest';
import {
  countOccurrences,
  distinct,
  objectToEntries,
  objectToKeys,
  pluralize,
  slugify,
  toArray,
} from './transformation';

describe('slugify', () => {
  it.each([
    ['Largest Contentful Paint', 'largest-contentful-paint'],
    ['cumulative-layout-shift', 'cumulative-layout-shift'],
    ['max-lines-200', 'max-lines-200'],
    ['rxjs/finnish', 'rxjs-finnish'],
    ['@typescript-eslint/no-explicit-any', 'typescript-eslint-no-explicit-any'],
    ['Code  PushUp ', 'code-pushup'],
  ])('should transform "%s" to valid slug "%s"', (text, slug) => {
    expect(slugify(text)).toBe(slug);
  });
});

describe('pluralize', () => {
  it.each([
    ['warning', 'warnings'],
    ['error', 'errors'],
    ['category', 'categories'],
    ['status', 'statuses'],
  ])('should pluralize "%s" as "%s"', (singular, plural) => {
    expect(pluralize(singular)).toBe(plural);
  });
});

describe('toArray', () => {
  it('should transform non-array value into array with single value', () => {
    expect(toArray('src/**/*.ts')).toEqual(['src/**/*.ts']);
  });

  it('should leave array value unchanged', () => {
    expect(toArray(['*.ts', '*.js'])).toEqual(['*.ts', '*.js']);
  });
});

describe('objectToKeys', () => {
  it('should transform object into array of keys', () => {
    const keys: 'prop1'[] = objectToKeys({ prop1: 1 });
    expect(keys).toEqual(['prop1']);
  });

  it('should transform empty object into empty array', () => {
    const keys: never[] = objectToKeys({});
    expect(keys).toEqual([]);
  });
});

describe('objectToEntries', () => {
  it('should transform object into array of entries', () => {
    const keys: ['prop1', number][] = objectToEntries({ prop1: 1 });
    expect(keys).toEqual([['prop1', 1]]);
  });

  it('should transform empty object into empty array', () => {
    const keys: [never, never][] = objectToEntries({});
    expect(keys).toEqual([]);
  });
});

describe('countOccurrences', () => {
  it('should return record with counts for each item', () => {
    expect(
      countOccurrences(['error', 'warning', 'error', 'error', 'warning']),
    ).toEqual({ error: 3, warning: 2 });
  });

  it('should return empty record for no matches', () => {
    expect(countOccurrences([])).toEqual({});
  });
});

describe('distinct', () => {
  it('should remove duplicate strings from array', () => {
    expect(
      distinct([
        'no-unused-vars',
        'no-invalid-regexp',
        'no-unused-vars',
        'no-invalid-regexp',
        '@typescript-eslint/no-unused-vars',
      ]),
    ).toEqual([
      'no-unused-vars',
      'no-invalid-regexp',
      '@typescript-eslint/no-unused-vars',
    ]);
  });
});
