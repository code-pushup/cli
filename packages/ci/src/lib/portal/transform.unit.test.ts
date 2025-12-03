import {
  IssueSeverity,
  type ReportFragment,
  TableAlignment,
} from '@code-pushup/portal-client';
import { reportSchema } from '@code-pushup/models';
import { transformGQLReport } from './transform.js';

describe('transformGQLReport', () => {
  const GQL_REPORT: ReportFragment = {
    commit: {
      sha: '4da737d63efcc83d0dd05620801f195968611eb7',
      message: 'Apply suggestions from code review',
      author: {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      date: '2025-08-01T00:00:00.000Z',
    },
    packageName: '@code-pushup/core',
    packageVersion: '0.42.0',
    commandStartDate: '2025-08-01T00:10:00.000Z',
    commandDuration: 30_000,
    categories: [
      {
        slug: 'code-style',
        title: 'Code style',
        score: 0.5,
        refs: [
          {
            target: {
              __typename: 'Group',
              plugin: { slug: 'eslint' },
              slug: 'suggestions',
            },
            weight: 1,
          },
        ],
      },
      {
        slug: 'bundle-size',
        title: 'Bundle size',
        score: 0.75,
        refs: [
          {
            target: {
              __typename: 'Audit',
              plugin: { slug: 'bundle-stats' },
              slug: 'initial',
            },
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
        packageName: '@code-pushup/eslint-plugin',
        packageVersion: '0.42.0',
        runnerStartDate: '2025-08-01T00:10:00.000Z',
        runnerDuration: 20_000,
        audits: {
          edges: [
            {
              node: {
                slug: 'max-lines',
                title: 'Enforce a maximum number of lines per file',
                score: 0,
                value: 1,
                formattedValue: '1 warning',
                details: { enabled: true, trees: [], tables: [] },
              },
            },
            {
              node: {
                slug: 'max-lines-per-function',
                title: 'Enforce a maximum number of lines of code per function',
                score: 1,
                value: 0,
                formattedValue: 'passed',
                details: { enabled: true, trees: [], tables: [] },
              },
            },
          ],
        },
        groups: [
          {
            slug: 'suggestions',
            title: 'Suggestion',
            score: 0.5,
            refs: [
              { target: { slug: 'max-lines' }, weight: 1 },
              { target: { slug: 'max-lines-per-function' }, weight: 1 },
            ],
          },
        ],
      },
      {
        slug: 'bundle-stats',
        title: 'Bundle stats',
        icon: 'javascript-map',
        runnerStartDate: '2025-08-01T00:10:20.000Z',
        runnerDuration: 10_000,
        audits: {
          edges: [
            {
              node: {
                slug: 'initial',
                title: 'Initial JavaScript bundle',
                score: 0.75,
                value: 420_000,
                formattedValue: '420 kB',
                details: {
                  enabled: true,
                  tables: [
                    {
                      header: [
                        { content: 'Group', alignment: TableAlignment.Left },
                        { content: 'Size', alignment: TableAlignment.Right },
                        { content: 'Modules', alignment: TableAlignment.Right },
                      ],
                      body: [
                        [
                          {
                            content: '3rd-party packages',
                            alignment: TableAlignment.Left,
                          },
                          {
                            content: '321.4 kB',
                            alignment: TableAlignment.Right,
                          },
                          {
                            content: '101',
                            alignment: TableAlignment.Right,
                          },
                        ],
                        [
                          {
                            content: 'Application shell',
                            alignment: TableAlignment.Left,
                          },
                          {
                            content: '98.6 kB',
                            alignment: TableAlignment.Right,
                          },
                          {
                            content: '7',
                            alignment: TableAlignment.Right,
                          },
                        ],
                      ],
                    },
                  ],
                  trees: [
                    {
                      __typename: 'BasicTree',
                      root: {
                        name: 'stats.json',
                        children: [
                          {
                            name: 'outputs',
                            children: [
                              {
                                name: 'dist/main.js',
                                customValues: [
                                  { key: 'size', value: '420 kB' },
                                ],
                                children: [
                                  {
                                    name: 'inputs',
                                    children: [
                                      {
                                        name: 'src/main.ts',
                                        customValues: [
                                          { key: 'size', value: '275 kB' },
                                        ],
                                      },
                                      {
                                        name: 'src/utils/format.ts',
                                        customValues: [
                                          { key: 'size', value: '120 kB' },
                                        ],
                                      },
                                      {
                                        name: 'src/utils/math.ts',
                                        customValues: [
                                          { key: 'size', value: '25 kB' },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        groups: [],
      },
    ],
    issues: {
      edges: [
        {
          node: {
            audit: { plugin: { slug: 'eslint' }, slug: 'max-lines' },
            message: 'File has too many lines (420). Maximum allowed is 300.',
            severity: IssueSeverity.Warning,
            source: {
              __typename: 'SourceCodeLocation',
              filePath: 'src/main.ts',
              startLine: 301,
              endLine: 420,
            },
          },
        },
        {
          node: {
            audit: { plugin: { slug: 'bundle-stats' }, slug: 'initial' },
            message:
              '`main.js` is **420 kB**, exceeds warning threshold of 350 kB',
            severity: IssueSeverity.Warning,
          },
        },
      ],
    },
  };

  it('should convert full GraphQL report to valid report.json format', () => {
    const report = transformGQLReport(GQL_REPORT);
    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(report).toMatchSnapshot();
  });
});
