import type { Report } from '@code-pushup/models';

export const MINIMAL_REPORT_MOCK = {
  packageName: '@code-pushup/core',
  version: '0.0.1',
  date: '2023-08-16T09:00:00.000Z',
  duration: 666,
  categories: [],
  plugins: [],
} satisfies Report;

export const REPORT_MOCK = {
  packageName: '@code-pushup/core',
  version: '1.0.0',
  date: '2023-08-16T09:00:00.000Z',
  duration: 666,
  categories: [
    {
      slug: 'test-results',
      title: 'Test results',
      refs: [
        {
          type: 'audit',
          slug: 'cypress-component-tests',
          plugin: 'cypress',
          weight: 1,
        },
        {
          type: 'audit',
          slug: 'cypress-e2e-tests',
          plugin: 'cypress',
          weight: 3,
        },
      ],
    },
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [
        {
          type: 'audit',
          slug: 'eslint-functional',
          plugin: 'eslint',
          weight: 1,
        },
        {
          type: 'group',
          slug: 'typescript-eslint',
          plugin: 'eslint',
          weight: 8,
        },
        {
          type: 'audit',
          slug: 'eslint-jest-consistent-naming',
          plugin: 'eslint',
          weight: 1,
        },
        {
          type: 'audit',
          slug: 'eslint-cypress',
          plugin: 'eslint',
          weight: 0,
        },
      ],
    },
  ],
  plugins: [
    {
      slug: 'cypress',
      title: 'Cypress results',
      date: '2023-08-16T09:00:00.000Z',
      duration: 42,
      icon: 'cypress',
      audits: [
        {
          slug: 'cypress-component-tests',
          title: 'Cypress component tests',
          value: 0,
          score: 1,
        },
        {
          slug: 'cypress-e2e-tests',
          title: 'Cypress e2e tests',
          value: 3,
          score: 0.5,
          details: {
            issues: [
              {
                message: 'Test `Display progress for selected commit` failed.',
                severity: 'error',
              },
              {
                message: 'Test `Sort audit table based on value` failed.',
                severity: 'error',
              },
              {
                message: 'Test `Open Bug prevention category detail` failed.',
                severity: 'error',
              },
            ],
          },
        },
      ],
    },
    {
      slug: 'eslint',
      title: 'ESLint',
      date: '2023-08-16T09:00:00.000Z',
      duration: 624,
      icon: 'eslint',
      groups: [
        {
          slug: 'typescript-eslint',
          title: 'TypeScript ESLint',
          refs: [
            {
              slug: 'typescript-eslint-typing',
              weight: 3,
            },
            {
              slug: 'typescript-eslint-enums',
              weight: 1,
            },
            {
              slug: 'typescript-eslint-experimental',
              weight: 0,
            },
          ],
        },
      ],
      audits: [
        {
          slug: 'eslint-cypress',
          title: 'Cypress rules',
          value: 0,
          score: 1,
        },
        {
          slug: 'typescript-eslint-typing',
          title: 'Type checking',
          value: 2,
          score: 0,
          details: {
            issues: [
              {
                message: 'command might be undefined',
                severity: 'warning',
                source: {
                  file: 'packages/cli/cli.ts',
                  position: {
                    startLine: 5,
                    startColumn: 10,
                    endLine: 5,
                    endColumn: 20,
                  },
                },
              },
              {
                message: 'outputFile does not exist in type Cli',
                severity: 'error',
                source: {
                  file: 'packages/cli/cli.ts',
                  position: {
                    startLine: 1,
                    startColumn: 1,
                    endLine: 5,
                    endColumn: 10,
                  },
                },
              },
            ],
          },
        },
        {
          slug: 'typescript-eslint-enums',
          title: 'Enumeration value checks',
          value: 0,
          score: 1,
        },
        {
          slug: 'typescript-eslint-experimental',
          title: 'TypeScript experimental checks',
          value: 1,
          score: 0,
          details: {
            issues: [{ message: 'Use better-enums.', severity: 'info' }],
          },
        },
        {
          slug: 'eslint-functional',
          title: 'Functional principles',
          value: 1,
          score: 0,
          details: {
            issues: [
              {
                message: 'Unexpected let, use const instead.',
                severity: 'error',
                source: {
                  file: 'packages/core/report.ts',
                },
              },
            ],
          },
        },
        {
          slug: 'eslint-jest-consistent-naming',
          title: 'Consistent naming',
          value: 0,
          score: 1,
        },
      ],
    },
  ],
} satisfies Report;
