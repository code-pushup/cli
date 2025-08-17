import { formatAsciiTree } from './tree.js';

describe('formatAsciiTree', () => {
  it('should format basic tree', () => {
    expect(
      formatAsciiTree({
        root: {
          name: 'https://example.com',
          children: [
            { name: 'https://example.com/styles/base.css' },
            { name: 'https://example.com/styles/theme.css' },
          ],
        },
      }),
    ).toMatchFileSnapshot('__snapshots__/basic-tree.txt');
  });

  it('should format basic tree with multi-level nesting', () => {
    expect(
      formatAsciiTree({
        root: {
          name: '.',
          children: [
            {
              name: 'src',
              children: [
                {
                  name: 'app',
                  children: [
                    {
                      name: 'components',
                      children: [
                        {
                          name: 'login',
                          children: [{ name: 'login.component.ts' }],
                        },
                        {
                          name: 'platform',
                          children: [{ name: 'platform.component.ts' }],
                        },
                      ],
                    },
                    {
                      name: 'services',
                      children: [
                        { name: 'api-client.service.ts' },
                        { name: 'auth.service.ts' },
                      ],
                    },
                    { name: 'app.component.ts' },
                    { name: 'app.config.ts' },
                    { name: 'app.routes.ts' },
                  ],
                },
                { name: 'main.ts' },
              ],
            },
          ],
        },
      }),
    ).toMatchFileSnapshot('__snapshots__/basic-tree.with-nesting.txt');
  });

  it('should format basic tree with custom node values', () => {
    expect(
      formatAsciiTree({
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
    ).toMatchFileSnapshot('__snapshots__/basic-tree.with-values.txt');
  });

  it('should format coverage tree', () => {
    expect(
      formatAsciiTree({
        type: 'coverage',
        root: {
          name: '.',
          values: { coverage: 0.72 },
          children: [
            {
              name: 'src',
              values: { coverage: 0.72 },
              children: [
                {
                  name: 'app',
                  values: { coverage: 0.88 },
                  children: [
                    {
                      name: 'components',
                      values: { coverage: 0.68 },
                      children: [
                        {
                          name: 'login',
                          values: { coverage: 0.48 },
                          children: [
                            {
                              name: 'login.component.ts',
                              values: { coverage: 0.48 },
                            },
                          ],
                        },
                        {
                          name: 'platform',
                          values: { coverage: 0.74 },
                          children: [
                            {
                              name: 'platform.component.ts',
                              values: { coverage: 0.74 },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      name: 'services',
                      values: { coverage: 0.97 },
                      children: [
                        {
                          name: 'api-client.service.ts',
                          values: { coverage: 0.99 },
                        },
                        {
                          name: 'auth.service.ts',
                          values: { coverage: 0.94 },
                        },
                      ],
                    },
                    {
                      name: 'app.component.ts',
                      values: { coverage: 0.92 },
                    },
                    {
                      name: 'app.config.ts',
                      values: { coverage: 1 },
                    },
                    {
                      name: 'app.routes.ts',
                      values: { coverage: 1 },
                    },
                  ],
                },
                {
                  name: 'main.ts',
                  values: { coverage: 0 },
                },
              ],
            },
          ],
        },
      }),
    ).toMatchFileSnapshot('__snapshots__/coverage-tree.txt');
  });

  it('should format coverage tree with missing lines', () => {
    expect(
      formatAsciiTree({
        type: 'coverage',
        title: 'Line coverage',
        root: {
          name: '.',
          values: { coverage: 0.7 },
          children: [
            {
              name: 'src',
              values: { coverage: 0.4539 },
              children: [
                {
                  name: 'components',
                  values: { coverage: 0.9736 },
                  children: [
                    {
                      name: 'CreateTodo.jsx',
                      values: { coverage: 1 },
                    },
                    {
                      name: 'TodoFilter.jsx',
                      values: {
                        coverage: 0.909,
                        missing: [{ startLine: 18, endLine: 18 }],
                      },
                    },
                    {
                      name: 'TodoList.jsx',
                      values: { coverage: 1 },
                    },
                  ],
                },
                {
                  name: 'hooks',
                  values: { coverage: 0 },
                  children: [
                    {
                      name: 'useTodos.js',
                      values: {
                        coverage: 0,
                        missing: [{ startLine: 1, endLine: 73 }],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ).toMatchFileSnapshot('__snapshots__/coverage-tree.with-missing-lines.txt');
  });

  it('should format coverage tree with missing lines referencing entities in code', () => {
    expect(
      formatAsciiTree({
        type: 'coverage',
        title: 'Docs coverage',
        root: {
          name: '.',
          values: { coverage: 0.7 },
          children: [
            {
              name: 'src',
              values: { coverage: 0.7 },
              children: [
                {
                  name: 'components',
                  values: { coverage: 0.8 },
                  children: [
                    {
                      name: 'App.tsx',
                      values: {
                        coverage: 0.75,
                        missing: [
                          {
                            startLine: 42,
                            endLine: 50,
                            name: 'login',
                            kind: 'function',
                          },
                          {
                            startLine: 52,
                            endLine: 55,
                            name: 'logout',
                            kind: 'function',
                          },
                        ],
                      },
                    },
                    {
                      name: 'Layout.tsx',
                      values: { coverage: 1 },
                    },
                  ],
                },
                {
                  name: 'index.ts',
                  values: { coverage: 1 },
                },
                {
                  name: 'utils.ts',
                  values: {
                    coverage: 0,
                    missing: [
                      {
                        startLine: 1,
                        endLine: 10,
                        name: 'ErrorBoundary',
                        kind: 'class',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      }),
    ).toMatchFileSnapshot('__snapshots__/coverage-tree.with-missing-named.txt');
  });
});
