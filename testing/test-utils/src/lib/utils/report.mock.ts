import type { PluginConfig, PluginReport, Report } from '@code-pushup/models';
import { COMMIT_MOCK } from './commit.mock';
import {
  auditReportMock,
  pluginConfigMock,
} from './dynamic-mocks/plugin-config.mock';

export const MINIMAL_REPORT_MOCK: Report = {
  packageName: '@code-pushup/core',
  version: '0.0.1',
  date: '2023-08-16T09:00:00.000Z',
  duration: 666,
  commit: COMMIT_MOCK,
  plugins: [
    {
      slug: 'eslint',
      title: 'ESLint',
      icon: 'eslint',
      audits: [
        {
          slug: 'no-any',
          title: 'No any type.',
          value: 1,
          score: 0,
        },
      ],
      date: '2023-08-16T09:00:00.000Z',
      duration: 420,
    },
  ],
};

export const REPORT_MOCK: Report = {
  packageName: '@code-pushup/core',
  version: '1.0.0',
  date: '2023-08-16T09:00:00.000Z',
  duration: 666,
  commit: COMMIT_MOCK,
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
          type: 'group',
          slug: 'typescript-eslint-extra',
          plugin: 'eslint',
          weight: 0,
        },
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
        {
          slug: 'typescript-eslint-extra',
          title: 'TypeScript ESLint Extra',
          refs: [
            {
              slug: 'typescript-eslint-experimental',
              weight: 1,
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
};

export function minimalReportMock(outputDir = 'tmp'): Report {
  const PLUGIN_1_SLUG = 'plugin-1';
  const AUDIT_1_SLUG = 'audit-1';

  const plg1: PluginConfig = pluginConfigMock([], {
    slug: PLUGIN_1_SLUG,
    outputDir,
  });

  const { runner: _, ...rest } = plg1;
  const pluginReport: PluginReport = {
    ...rest,
    duration: 0,
    date: 'dummy-data-string',
    version: '',
    packageName: '',
    audits: [auditReportMock({ slug: AUDIT_1_SLUG })],
  };

  return JSON.parse(
    JSON.stringify({
      packageName: '@code-pushup/core',
      version: '0.1.0',
      date: 'today',
      commit: null,
      duration: 42,
      categories: [
        {
          slug: 'category-1',
          title: 'Category 1',
          refs: [
            {
              type: 'audit',
              plugin: PLUGIN_1_SLUG,
              slug: AUDIT_1_SLUG,
              weight: 1,
            },
          ],
        },
      ],
      plugins: [pluginReport],
    } satisfies Report),
  );
}
