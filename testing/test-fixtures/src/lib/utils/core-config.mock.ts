import { type CoreConfig } from '@code-pushup/models';

export const CORE_CONFIG_MOCK = {
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [
        {
          type: 'audit',
          plugin: 'vitest',
          slug: 'vitest-unit-tests',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'cypress',
          slug: 'cypress-e2e-tests',
          weight: 1,
        },
      ],
    },
  ],
  plugins: [
    {
      slug: 'vitest',
      title: 'Vitest results',
      icon: 'vitest',
      description: 'Vitest test results analysis',
      docsUrl: 'https://vitest.dev/',
      audits: [
        {
          slug: 'vitest-unit-tests',
          title: 'Vitest unit tests',
          description: 'Vitest unit tests results analysis',
          docsUrl: 'https://vitest.dev/',
        },
      ],
      runner: {
        command: 'npx',
        args: ['nx run cli:unit-test'],
        outputFile: 'cli-unit-tests.json',
      },
    },
    {
      slug: 'cypress',
      title: 'Cypress results',
      icon: 'cypress',
      description: 'Cypress test results analysis',
      docsUrl: 'https://Cypress.dev/',
      audits: [
        {
          slug: 'cypress-e2e-tests',
          title: 'Cypress e2e tests',
          description: 'Cypress e2e tests results analysis',
          docsUrl: 'https://docs.cypress.io/',
        },
      ],
      runner: {
        command: 'npx',
        args: ['cypress run'],
        outputFile: 'ui-e2e-tests.json',
      },
    },
  ],
} satisfies CoreConfig;
