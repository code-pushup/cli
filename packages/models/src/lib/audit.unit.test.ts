import { describe, expect, it } from 'vitest';
import { type Audit, auditSchema, pluginAuditsSchema } from './audit.js';

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

  it('should ignore invalid docs URL', () => {
    expect(
      auditSchema.parse({
        slug: 'consistent-test-it',
        title: 'Use a consistent test function.',
        docsUrl: 'invalid-url',
      } satisfies Audit),
    ).toEqual<Audit>({
      slug: 'consistent-test-it',
      title: 'Use a consistent test function.',
      docsUrl: '',
    });
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
    ).toThrow(
      String.raw`Audit slugs must be unique, but received duplicates: \"jest-unit-test-results\"`,
    );
  });
});
