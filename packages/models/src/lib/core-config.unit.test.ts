import { describe, expect, it } from 'vitest';
import { type CoreConfig, coreConfigSchema } from './core-config';

describe('coreConfigSchema', () => {
  it('should accept a valid core configuration with all entities', () => {
    expect(() =>
      coreConfigSchema.parse({
        categories: [
          {
            slug: 'test-results',
            title: 'Test results',
            refs: [
              {
                plugin: 'jest',
                slug: 'unit-tests',
                type: 'group',
                weight: 1,
              },
            ],
          },
        ],
        plugins: [
          {
            slug: 'jest',
            title: 'Jest',
            icon: 'jest',
            runner: { command: 'npm run test', outputFile: 'jest-output.json' },
            audits: [{ slug: 'jest-unit-tests', title: 'Jest unit tests.' }],
            groups: [
              {
                slug: 'unit-tests',
                title: 'Unit tests',
                refs: [{ slug: 'jest-unit-tests', weight: 2 }],
              },
            ],
          },
        ],
        persist: { format: ['md'] },
        upload: {
          apiKey: 'AP7-K3Y',
          organization: 'code-pushup',
          project: 'cli',
          server: 'https://api.code-pushup.org',
        },
      } satisfies CoreConfig),
    ).not.toThrow();
  });

  it('should accept a minimal core configuration', () => {
    expect(() =>
      coreConfigSchema.parse({
        plugins: [
          {
            slug: 'eslint',
            title: 'ESLint',
            icon: 'eslint',
            runner: { command: 'npm run lint', outputFile: 'output.json' },
            audits: [{ slug: 'no-magic-numbers', title: 'No magic numbers.' }],
          },
        ],
      } satisfies CoreConfig),
    ).not.toThrow();
  });

  it('should throw for an empty configuration with no plugins', () => {
    expect(() => coreConfigSchema.parse({ plugins: [] })).toThrow('too_small');
  });

  it('should throw for a category reference not found in audits', () => {
    expect(() =>
      coreConfigSchema.parse({
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug prevention',
            refs: [
              {
                plugin: 'vitest',
                slug: 'unit-tests',
                type: 'audit',
                weight: 1,
              },
            ],
          },
        ],
        plugins: [
          {
            slug: 'jest',
            title: 'Jest',
            icon: 'jest',
            runner: { command: 'npm run test', outputFile: 'output.json' },
            audits: [{ slug: 'unit-tests', title: 'Jest unit tests.' }],
          },
        ],
      } satisfies CoreConfig),
    ).toThrow(
      'category references need to point to an audit or group: vitest/unit-tests',
    );
  });

  it('should throw for a category reference not found in groups', () => {
    expect(() =>
      coreConfigSchema.parse({
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug prevention',
            refs: [
              {
                plugin: 'eslint',
                slug: 'eslint-errors',
                type: 'group',
                weight: 1,
              },
            ],
          },
        ],
        plugins: [
          {
            slug: 'eslint',
            title: 'ESLint',
            icon: 'eslint',
            runner: { command: 'npm run lint', outputFile: 'output.json' },
            audits: [{ slug: 'eslint-errors', title: 'ESLint errors.' }],
            groups: [
              {
                slug: 'eslint-suggestions',
                title: 'ESLint suggestions',
                refs: [{ slug: 'eslint-errors', weight: 1 }],
              },
            ],
          },
        ],
      } satisfies CoreConfig),
    ).toThrow(
      'category references need to point to an audit or group: eslint#eslint-errors (group)',
    );
  });
});
