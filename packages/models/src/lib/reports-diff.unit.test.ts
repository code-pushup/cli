import { type ReportsDiff, reportsDiffSchema } from './reports-diff.js';

describe('reportsDiffSchema', () => {
  it('should parse valid reports diff', () => {
    expect(() =>
      reportsDiffSchema.parse({
        commits: {
          before: {
            hash: 'abcdef0123456789abcdef0123456789abcdef01',
            message: 'Do stuff',
            author: 'John Doe',
            date: new Date('2023-03-07T23:00:00+01:00'),
          },
          after: {
            hash: '0123456789abcdef0123456789abcdef01234567',
            message: 'Fix stuff',
            author: 'Jane Doe',
            date: new Date(),
          },
        },
        portalUrl:
          'https://code-pushup.example.com/portal/example/website/comparison/abcdef0123456789abcdef0123456789abcdef01/0123456789abcdef0123456789abcdef01234567',
        label: 'website',
        date: new Date().toISOString(),
        duration: 42,
        packageName: '@code-pushup/core',
        version: '1.2.3',
        categories: {
          changed: [
            {
              slug: 'perf',
              title: 'Performance',
              scores: { before: 0.7, after: 0.66, diff: -0.04 },
            },
          ],
          unchanged: [{ slug: 'a11y', title: 'Accessibility', score: 1 }],
          added: [],
          removed: [],
        },
        groups: {
          changed: [],
          unchanged: [],
          added: [],
          removed: [
            {
              slug: 'problems',
              title: 'Problems',
              plugin: { slug: 'eslint', title: 'ESLint' },
              score: 0.8,
            },
          ],
        },
        audits: {
          changed: [
            {
              slug: 'lcp',
              title: 'Largest Contentful Paint',
              plugin: { slug: 'lighthouse', title: 'Lighthouse' },
              scores: {
                before: 0.9,
                after: 0.7,
                diff: -0.2,
              },
              values: {
                before: 1810,
                after: 1920,
                diff: 110,
              },
              displayValues: {
                before: '1.8 s',
                after: '1.9 s',
              },
            },
          ],
          unchanged: [
            {
              slug: 'image-alt',
              title: 'Image elements have `[alt]` attributes',
              plugin: { slug: 'lighthouse', title: 'Lighthouse' },
              score: 1,
              value: 0,
            },
          ],
          added: [
            {
              slug: 'document-title',
              title: 'Document has a `<title>` element',
              plugin: { slug: 'lighthouse', title: 'Lighthouse' },
              score: 1,
              value: 0,
            },
          ],
          removed: [],
        },
      } satisfies ReportsDiff),
    ).not.toThrow();
  });
});
