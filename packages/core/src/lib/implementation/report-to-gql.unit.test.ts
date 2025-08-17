import { describe } from 'vitest';
import { type AuditReportTree, TreeType } from '@code-pushup/portal-client';
import { issueToGQL, tableToGQL, treeToGQL } from './report-to-gql.js';

describe('issueToGQL', () => {
  it('transforms issue to GraphQL input type', () => {
    expect(
      issueToGQL({
        message: 'No let, use const instead.',
        severity: 'error',
        source: {
          file: 'cli.ts',
          position: { startLine: 5, startColumn: 10, endColumn: 25 },
        },
      }),
    ).toStrictEqual({
      message: 'No let, use const instead.',
      severity: 'Error',
      sourceType: 'SourceCode',
      sourceFilePath: 'cli.ts',
      sourceStartLine: 5,
      sourceStartColumn: 10,
      sourceEndLine: undefined,
      sourceEndColumn: 25,
    });
  });
});

describe('tableToGQL', () => {
  it('should transform primitive table to GraphQL input type', () => {
    expect(
      tableToGQL({
        columns: ['left', 'right'],
        rows: [
          ['Script Evaluation', '3,167 ms'],
          ['Style & Layout', '1,422 ms'],
          ['Other', '712 ms'],
        ],
      }),
    ).toStrictEqual({
      columns: [{ alignment: 'Left' }, { alignment: 'Right' }],
      rows: [
        [{ content: 'Script Evaluation' }, { content: '3,167 ms' }],
        [{ content: 'Style & Layout' }, { content: '1,422 ms' }],
        [{ content: 'Other' }, { content: '712 ms' }],
      ],
    });
  });

  it('should transform object table to GraphQL input type', () => {
    expect(
      tableToGQL({
        columns: [
          { key: 'category', label: 'Category', align: 'left' },
          { key: 'timeSpent', label: 'Time Spent', align: 'right' },
        ],
        rows: [
          { category: 'Script Evaluation', timeSpent: '3,167 ms' },
          { category: 'Style & Layout', timeSpent: '1,422 ms' },
          { category: 'Other', timeSpent: '712 ms' },
        ],
      }),
    ).toStrictEqual({
      columns: [
        { key: 'category', label: 'Category', alignment: 'Left' },
        { key: 'timeSpent', label: 'Time Spent', alignment: 'Right' },
      ],
      rows: [
        [
          { key: 'category', content: 'Script Evaluation' },
          { key: 'timeSpent', content: '3,167 ms' },
        ],
        [
          { key: 'category', content: 'Style & Layout' },
          { key: 'timeSpent', content: '1,422 ms' },
        ],
        [
          { key: 'category', content: 'Other' },
          { key: 'timeSpent', content: '712 ms' },
        ],
      ],
    });
  });
});

describe('treeToGQL', () => {
  it('should transform basic tree', () => {
    expect(
      treeToGQL({
        title: 'Critical request chain',
        root: {
          name: 'https://example.com',
          children: [
            {
              name: 'https://example.com/styles/base.css',
              values: { size: '2 kB', duration: 20 },
            },
            {
              name: 'https://example.com/styles/theme.css',
              values: { size: '10 kB', duration: 100 },
            },
          ],
        },
      }),
    ).toStrictEqual<AuditReportTree>({
      type: TreeType.Basic,
      title: 'Critical request chain',
      root: {
        name: 'https://example.com',
        children: [
          {
            name: 'https://example.com/styles/base.css',
            values: [
              { key: 'size', value: '2 kB' },
              { key: 'duration', value: '20' },
            ],
          },
          {
            name: 'https://example.com/styles/theme.css',
            values: [
              { key: 'size', value: '10 kB' },
              { key: 'duration', value: '100' },
            ],
          },
        ],
      },
    });
  });

  it('should transform coverage tree', () => {
    expect(
      treeToGQL({
        type: 'coverage',
        title: 'Function coverage',
        root: {
          name: '.',
          values: { coverage: 0.7 },
          children: [
            {
              name: 'src',
              values: { coverage: 0.7 },
              children: [
                {
                  name: 'App.tsx',
                  values: {
                    coverage: 0.8,
                    missing: [
                      {
                        startLine: 42,
                        endLine: 50,
                        name: 'login',
                        kind: 'function',
                      },
                    ],
                  },
                },
                {
                  name: 'index.ts',
                  values: {
                    coverage: 0,
                    missing: [{ startLine: 1, endLine: 10 }],
                  },
                },
              ],
            },
          ],
        },
      }),
    ).toStrictEqual<AuditReportTree>({
      type: TreeType.Coverage,
      title: 'Function coverage',
      root: {
        name: '.',
        coverage: 0.7,
        children: [
          {
            name: 'src',
            coverage: 0.7,
            children: [
              {
                name: 'App.tsx',
                coverage: 0.8,
                missing: [
                  {
                    startLine: 42,
                    endLine: 50,
                    name: 'login',
                    kind: 'function',
                  },
                ],
              },
              {
                name: 'index.ts',
                coverage: 0,
                missing: [{ startLine: 1, endLine: 10 }],
              },
            ],
          },
        ],
      },
    });
  });
});
