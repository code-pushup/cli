import { type BasicTree, type CoverageTree, treeSchema } from './tree.js';

describe('treeSchema', () => {
  it('should accept basic tree', () => {
    expect(() =>
      treeSchema.parse({
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
      } satisfies BasicTree),
    ).not.toThrow();
  });

  it('should accept coverage tree', () => {
    expect(() =>
      treeSchema.parse({
        type: 'coverage',
        title: 'Critical request chain',
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
      } satisfies CoverageTree),
    ).not.toThrow();
  });
});
