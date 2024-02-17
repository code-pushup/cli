import { describe, expect, it } from 'vitest';
import { Audit, auditSchema, pluginAuditsSchema } from './audit';

describe('auditSchema', () => {
  it('should accept a valid audit with all information', () => {
    expect(() =>
      auditSchema.parse({
        slug: 'no-conditionals-in-tests',
        title: 'No conditional logic is used in tests.',
        description: 'Conditional logic does not produce stable results.',
        docsUrl:
          'https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-conditional-in-test.md',
      } satisfies Audit),
    ).not.toThrow();
  });

  it('should accept a valid audit with minimum information', () => {
    expect(() =>
      auditSchema.parse({
        slug: 'jest-unit-test-results',
        title: 'Jest unit tests results.',
      } satisfies Audit),
    ).not.toThrow();
  });

  it('should throw for an invalid URL', () => {
    expect(() =>
      auditSchema.parse({
        slug: 'consistent-test-it',
        title: 'Use a consistent test function.',
        docsUrl: 'invalid-url',
      } satisfies Audit),
    ).toThrow('Invalid url');
  });
});

describe('pluginAuditsSchema', () => {
  it('should parse a valid audit array', () => {
    expect(() =>
      pluginAuditsSchema.parse([
        {
          slug: 'consistent-test-it',
          title: 'Use a consistent test function.',
        },
        {
          slug: 'jest-unit-test-results',
          title: 'Jest unit tests results.',
        },
      ] satisfies Audit[]),
    ).not.toThrow();
  });

  it('should throw for an empty array', () => {
    expect(() => pluginAuditsSchema.parse([])).toThrow('too_small');
  });

  it('should throw for duplicate audits', () => {
    expect(() =>
      pluginAuditsSchema.parse([
        {
          slug: 'consistent-test-it',
          title: 'Use a consistent test function.',
        },
        {
          slug: 'jest-unit-test-results',
          title: 'Jest unit tests results.',
        },
        {
          slug: 'jest-unit-test-results',
          title: 'Jest unit tests results.',
        },
      ] satisfies Audit[]),
    ).toThrow('slugs are not unique: jest-unit-test-results');
  });
});
