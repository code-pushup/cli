import {
  type CategoryConfig,
  type CategoryRef,
  categoriesSchema,
  categoryConfigSchema,
  categoryRefSchema,
} from './category-config.js';

describe('categoryRefSchema', () => {
  it('should accept a valid category reference audit', () => {
    expect(() =>
      categoryRefSchema.parse({
        plugin: 'eslint',
        slug: 'no-magic-numbers',
        type: 'audit',
        weight: 1,
      } satisfies CategoryRef),
    ).not.toThrow();
  });

  it('should accept a valid category reference group', () => {
    expect(() =>
      categoryRefSchema.parse({
        plugin: 'lighthouse',
        slug: 'lighthouse-performance',
        type: 'group',
        weight: 5,
      } satisfies CategoryRef),
    ).not.toThrow();
  });

  it('should accept a zero-weight reference', () => {
    expect(() =>
      categoryRefSchema.parse({
        plugin: 'npm-audit',
        slug: 'npm-audit-experimental',
        type: 'audit',
        weight: 0,
      } satisfies CategoryRef),
    ).not.toThrow();
  });

  it('should throw for a negative weight', () => {
    expect(() =>
      categoryRefSchema.parse({
        plugin: 'npm-audit',
        slug: 'npm-audit-experimental',
        type: 'audit',
        weight: -2,
      } satisfies CategoryRef),
    ).toThrow('Too small: expected number to be >=0');
  });

  it('should throw for an invalid reference type', () => {
    expect(() =>
      categoryRefSchema.parse({
        plugin: 'cypress',
        slug: 'cypress-e2e',
        type: 'issue',
        weight: 1,
      }),
    ).toThrow(String.raw`Invalid option: expected one of \"audit\"|\"group\"`);
  });

  it('should throw for a missing weight', () => {
    expect(() =>
      categoryRefSchema.parse({
        plugin: 'cypress',
        slug: 'cypress-e2e',
        type: 'audit',
      }),
    ).toThrow('invalid_type');
  });

  it('should throw for an invalid slug', () => {
    expect(() =>
      categoryRefSchema.parse({
        plugin: 'jest',
        slug: '-invalid-jest-slug',
        type: 'audit',
      }),
    ).toThrow('The slug has to follow the pattern');
  });
});

describe('categoryConfigSchema', () => {
  it('should accept a valid category configuration with all entities', () => {
    expect(() =>
      categoryConfigSchema.parse({
        slug: 'test-results',
        title: 'Test results',
        description: 'This category collects test results.',
        docsUrl: 'https://www.cypress.io/',
        refs: [
          {
            plugin: 'cypress',
            slug: 'cypress-e2e',
            type: 'audit',
            weight: 1,
          },
        ],
      } satisfies CategoryConfig),
    ).not.toThrow();
  });

  it('should accept a minimal category configuration', () => {
    expect(() =>
      categoryConfigSchema.parse({
        slug: 'bug-prevention',
        title: 'Bug prevention',
        refs: [
          {
            plugin: 'eslint',
            slug: 'no-magic-numbers',
            type: 'audit',
            weight: 1,
          },
        ],
      } satisfies CategoryConfig),
    ).not.toThrow();
  });

  it('should accept a valid category configuration with a score target', () => {
    expect(() =>
      categoryConfigSchema.parse({
        slug: 'core-web-vitals',
        title: 'Core Web Vitals',
        scoreTarget: 0.9,
        refs: [
          {
            plugin: 'lighthouse',
            slug: 'largest-contentful-paint',
            type: 'audit',
            weight: 3,
          },
          {
            plugin: 'lighthouse',
            slug: 'first-input-delay',
            type: 'audit',
            weight: 2,
          },
        ],
      } satisfies CategoryConfig),
    ).not.toThrow();
  });

  it('should throw for an empty category', () => {
    expect(() =>
      categoryConfigSchema.parse({
        slug: 'in-progress',
        title: 'This category is empty for now',
        refs: [],
      } satisfies CategoryConfig),
    ).toThrow('In a category, there has to be at least one ref');
  });

  it('should throw for duplicate category references', () => {
    expect(() =>
      categoryConfigSchema.parse({
        slug: 'jest',
        title: 'Jest results',
        refs: [
          {
            plugin: 'jest',
            slug: 'jest-unit-tests',
            type: 'audit',
            weight: 1,
          },
          {
            plugin: 'jest',
            slug: 'jest-unit-tests',
            type: 'audit',
            weight: 2,
          },
        ],
      } satisfies CategoryConfig),
    ).toThrow(
      String.raw`Category has duplicate references: audit \"jest-unit-tests\" (plugin \"jest\")`,
    );
  });

  it('should throw for a category with only zero-weight references', () => {
    expect(() =>
      categoryConfigSchema.parse({
        slug: 'informational',
        title: 'This category is informational',
        refs: [
          {
            plugin: 'eslint',
            slug: 'functional/immutable-data',
            type: 'audit',
            weight: 0,
          },
          {
            plugin: 'lighthouse',
            slug: 'lighthouse-experimental',
            type: 'group',
            weight: 0,
          },
        ],
      } satisfies CategoryConfig),
    ).toThrow('A category must have at least 1 ref with weight > 0.');
  });
});

describe('categoriesSchema', () => {
  it('should accept a valid category array', () => {
    expect(() =>
      categoriesSchema.parse([
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          refs: [
            {
              plugin: 'eslint',
              slug: 'no-magic-numbers',
              type: 'audit',
              weight: 1,
            },
          ],
        },
        {
          slug: 'code-style',
          title: 'Code style',
          refs: [
            {
              plugin: 'eslint',
              slug: 'consistent-test-it',
              type: 'audit',
              weight: 1,
            },
          ],
        },
      ] satisfies CategoryConfig[]),
    ).not.toThrow();
  });

  it('should accept an empty category array', () => {
    expect(() => categoriesSchema.parse([])).not.toThrow();
  });

  it('should throw for category duplicates', () => {
    expect(() =>
      categoriesSchema.parse([
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          refs: [
            {
              plugin: 'eslint',
              slug: 'no-magic-numbers',
              type: 'audit',
              weight: 1,
            },
          ],
        },
        {
          slug: 'bug-prevention',
          title: 'Test results',
          refs: [
            {
              plugin: 'jest',
              slug: 'jest-unit-tests',
              type: 'audit',
              weight: 1,
            },
          ],
        },
      ] satisfies CategoryConfig[]),
    ).toThrow(
      String.raw`Category slugs must be unique, but received duplicates: \"bug-prevention\"`,
    );
  });
});
