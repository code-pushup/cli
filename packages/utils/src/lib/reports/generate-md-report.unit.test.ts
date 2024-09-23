import { describe, expect, it } from 'vitest';
import type { AuditReport, Issue, Table } from '@code-pushup/models';
import { tableSection } from './formatting';
import {
  aboutSection,
  auditDetails,
  auditDetailsAuditValue,
  auditDetailsIssues,
  auditsSection,
  generateMdReport,
} from './generate-md-report';
import type { ScoredReport } from './types';

const baseScoredReport = {
  date: '2025.01.01',
  duration: 4200,
  version: 'v1.0.0',
  commit: {
    message: 'ci: update action',
    author: 'Michael <michael.hladky@push-based.io>',
    date: new Date('2025.01.01'),
    hash: '535b8e9e557336618a764f3fa45609d224a62837',
  },
  plugins: [
    {
      slug: 'lighthouse',
      version: '1.0.1',
      duration: 15_365,
      title: 'Lighthouse',
      audits: [
        {
          slug: 'largest-contentful-paint',
          title: 'Largest Contentful Paint',
          score: 0.6,
          value: 2700,
        },
      ],
    },
  ],
  categories: [
    {
      title: 'Performance',
      slug: 'performance',
      score: 0.93,
      refs: [{ slug: 'largest-contentful-paint', plugin: 'lighthouse' }],
    },
  ],
} as ScoredReport;

// === Audit Details

describe('auditDetailsAuditValue', () => {
  it('should include score', () => {
    expect(
      auditDetailsAuditValue({ score: 0.77 } as AuditReport).toString(),
    ).toMatch('(score: 77)');
  });

  it('should include value', () => {
    expect(
      auditDetailsAuditValue({ value: 125 } as AuditReport).toString(),
    ).toMatch('**125**');
  });

  it('should add score icon for scores at the beginning', () => {
    expect(
      auditDetailsAuditValue({ score: 0 } as AuditReport).toString(),
    ).toMatch(/^🟥/);
  });

  it('should include both display value and score when provided', () => {
    expect(
      auditDetailsAuditValue({
        score: 1,
        displayValue: '100ms',
      } as AuditReport).toString(),
    ).toBe('🟩 **100ms** (score: 100)');
  });
});

describe('auditDetailsIssues', () => {
  it('should render complete section', () => {
    expect(
      auditDetailsIssues([
        {
          severity: 'info',
          message: 'File `index.js` is 56Kb.',
          source: {
            file: 'index.js',
          },
        },
        {
          severity: 'warning',
          message: 'Package license is has to be "MIT"',
          source: {
            file: 'package.json',
            position: {
              startLine: 4,
            },
          },
        },
        {
          severity: 'error',
          message: 'no unused vars',
          source: {
            file: 'index.js',
            position: {
              startLine: 400,
              endLine: 200,
            },
          },
        },
      ])?.toString(),
    ).toMatchSnapshot();
  });

  it('should return empty string for missing issues', () => {
    expect(auditDetailsIssues()).toBeNull();
  });

  it('should include message', () => {
    expect(
      auditDetailsIssues([
        { message: 'File `index.js` is 56Kb too big.', severity: 'error' },
      ])?.toString(),
    ).toMatch('File `index.js` is 56Kb too big.');
  });

  it('should include correct severity icon', () => {
    expect(
      auditDetailsIssues([{ severity: 'info' } as Issue])?.toString(),
    ).toMatch('ℹ️');
  });

  it('should include source file', () => {
    expect(
      auditDetailsIssues([
        { source: { file: '/index.js' }, severity: 'error' } as Issue,
      ])?.toString(),
    ).toMatch('`/index.js`');
  });

  it('should include source file linked with position', () => {
    expect(
      auditDetailsIssues(
        [
          {
            source: {
              file: '/src/index.js',
              position: {
                startLine: 4,
                startColumn: 7,
              },
            },
            severity: 'warning',
          } as Issue,
        ],
        { outputDir: '/.code-pushup' },
      )?.toString(),
    ).toMatch('`[/src/index.js](../src/index.js:4:7)`');
  });

  it('should include formatted line information', () => {
    expect(
      auditDetailsIssues([
        {
          source: {
            file: 'index.js',
            position: {
              startLine: 4,
              endLine: 7,
            },
          },
          severity: 'warning',
        } as Issue,
      ])?.toString(),
    ).toMatch(/\|\s*4-7\s*\|/);
  });
});

describe('tableSection', () => {
  it('should render complete section', () => {
    expect(
      tableSection({
        columns: [
          { key: 'phase', label: 'Phase' },
          { key: 'percentageLcp', label: '% of LCP' },
          { key: 'timing', label: 'Timing' },
        ],
        rows: [
          {
            phase: 'TTFB',
            percentageLcp: '27%',
            timing: '620 ms',
          },
          {
            phase: 'Load Delay',
            percentageLcp: '25%',
            timing: '580 ms',
          },
          {
            phase: 'Load Time',
            percentageLcp: '41%',
            timing: '940 ms',
          },
          {
            phase: 'Render Delay',
            percentageLcp: '6%',
            timing: '140 ms',
          },
        ],
      })?.toString(),
    ).toMatchSnapshot();
  });
});

describe('auditDetails', () => {
  it('should only return audit value if no details are given', () => {
    expect(
      auditDetails({ score: 0, value: 125 } as AuditReport).toString(),
    ).toBe('🟥 **125** (score: 0)\n');
  });

  it('should wrap details into an HTML details element if details are present', () => {
    const md = auditDetails({
      score: 0,
      value: 0,
      details: {
        issues: [{ severity: 'error' }],
        table: { rows: [['']] },
      },
    } as AuditReport).toString();
    expect(md).toMatch('<details>');
    expect(md).toMatch('<summary>🟥 <b>0</b> (score: 0)</summary>');
    expect(md).toMatch('</details>');
  });

  it('should display issue section if issues are present', () => {
    const md = auditDetails({
      score: 0,
      value: 0,
      details: {
        issues: [{ severity: 'warning' }],
      },
    } as AuditReport).toString();
    expect(md).toMatch('<details>');
    expect(md).toMatch('#### Issues');
    expect(md).not.toMatch('#### Additional Information');
  });

  it('should skip issue section if empty issues array is present', () => {
    const md = auditDetails({
      score: 0,
      value: 0,
      details: {
        issues: [] as Issue[],
      },
    } as AuditReport).toString();
    expect(md).not.toMatch('<details>');
    expect(md).not.toMatch('#### Issues');
    expect(md).not.toMatch('#### Additional Information');
  });

  it('should display table section if table is present', () => {
    const md = auditDetails({
      slug: 'prefer-design-system-over-css-classes',
      title: 'Prefer the design system over CSS classes',
      score: 0.99,
      value: 0,
      displayValue: '190ms',
      details: {
        table: {
          title: 'Elements',
          rows: [
            {
              element: 'button',
            },
            {
              element: 'div',
            },
          ],
        },
      },
    } as AuditReport).toString();
    expect(md).toMatch('<details>');
    expect(md).toMatch('#### Elements');
    expect(md).toMatch(/\|\s*button\s*\|/);
    expect(md).toMatch(/\|\s*div\s*\|/);
    expect(md).not.toMatch('#### Issues');
  });

  it('should render complete details section', () => {
    expect(
      auditDetails({
        slug: 'prefer-design-system-over-css-classes',
        title: 'Prefer the design system over CSS classes',
        score: 0.99,
        value: 0,
        displayValue: '190ms',
        details: {
          table: {
            columns: [
              { key: 'classNames', label: 'Class Names' },
              { key: 'element' },
            ],
            rows: [
              {
                classNames: '.btn, .icon',
                element: 'button',
              },
              {
                classNames: '.badge, .badge-icon',
                element: 'div',
              },
            ],
          },
          issues: [
            {
              message: 'Use design system components instead of classes',
              severity: 'error',
              source: {
                file: 'list.component.ts',
                position: {
                  startLine: 400,
                  endLine: 200,
                },
              },
            },
            {
              message: 'File size is 20KB too big',
              severity: 'error',
              source: {
                file: 'list.component.ts',
              },
            },
          ],
        },
      } as AuditReport).toString(),
    ).toMatchSnapshot();
  });
});

describe('auditsSection', () => {
  it('should render section heading', () => {
    expect(
      auditsSection({
        plugins: [{ audits: [] as AuditReport[] }],
      } as ScoredReport).toString(),
    ).toMatch('## 🛡️ Audits');
  });

  it('should render audit result', () => {
    expect(
      auditsSection({
        plugins: [{ audits: [{ score: 1, value: 0 }] }],
      } as ScoredReport).toString(),
    ).toMatch('🟩 **0** (score: 100)');
  });

  it('should render audit details', () => {
    const md = auditsSection({
      plugins: [
        {
          audits: [
            {
              details: {
                issues: [{ severity: 'error' }] as Issue[],
                table: { rows: [{ value: 42 }] } as Table,
              },
            },
          ],
        },
      ],
    } as ScoredReport).toString();
    expect(md).toMatch('#### Issues');
    expect(md).toMatch(
      /\|\s*Severity\s*\|\s*Message\s*\|\s*Source file\s*\|\s*Line\(s\)\s*\|/,
    );
    expect(md).toMatch(/\|\s*value\s*\|/);
  });

  it('should render audit meta information', () => {
    expect(
      auditsSection({
        plugins: [
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
            audits: [
              {
                slug: 'interaction-to-next-paint',
                title: 'Interaction to next paint',
                score: 0.74,
                value: 2163,
                description: 'Measures responsiveness.',
                docsUrl: 'https://web.dev/inp',
              },
            ],
          },
        ],
      } as ScoredReport).toString(),
    ).toMatch(`Measures responsiveness. [📖 Docs](https://web.dev/inp)`);
  });

  it('should render complete audit section', () => {
    expect(
      auditsSection({
        plugins: [
          {
            slug: 'eslint',
            title: 'ESLint',
            audits: [
              {
                slug: 'no-any',
                title: 'No any',
                description: 'No unsafe any assignment',
                score: 1,
                value: 0,
              },
              {
                slug: 'no-let',
                title: 'No let',
                score: 0,
                value: 5,
                displayValue: '5 errors',
              },
            ],
          },
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
            audits: [
              {
                slug: 'largest-contentful-paint',
                title: 'Largest contentful paint',
                description: 'No unsafe any assignment',
                docsUrl: 'https://web.dev/lcp',
                score: 0.6,
                value: 0,
              },
            ],
          },
        ],
      } as ScoredReport).toString(),
    ).toMatchSnapshot();
  });
});

// === About

describe('aboutSection', () => {
  it('should return about section with h2 and created by in plain test', () => {
    const md = aboutSection(baseScoredReport).toString();
    expect(md).toMatch('## About');
    expect(md).toMatch(
      'Report was created by [Code PushUp](https://github.com/code-pushup/cli#readme) on Wed, Jan 1, 2025, 12:00 AM UTC.',
    );
  });

  it('should return commit section', () => {
    const md = aboutSection({
      ...baseScoredReport,
      plugins: [
        {
          version: '1.1.1',
          duration: 4200,
          title: 'Lighthouse',
          audits: Array.from({ length: 3 }),
        },
      ],
      categories: Array.from({ length: 3 }),
    } as ScoredReport).toString();
    expect(md).toMatch(
      /\|\s*Commit\s*\|\s*Version\s*\|\s*Duration\s*\|\s*Plugins\s*\|\s*Categories\s*\|\s*Audits\s*\|/,
    );
    expect(md).toMatch(
      /\|\s*ci: update action \(535b8e9e557336618a764f3fa45609d224a62837\)\s*\|\s*`v1.0.0`\s*\|\s*4.20 s\s*\|\s*1\s*\|\s*3\s*\|\s*3\s*\|/,
    );
  });

  it('should return plugins section with content', () => {
    const md = aboutSection({
      ...baseScoredReport,
      plugins: [
        {
          version: '1.0.1',
          duration: 15_365,
          title: 'Lighthouse',
          audits: Array.from({ length: 78 }),
        },
        {
          version: '0.3.12',
          duration: 260,
          title: 'File Size',
          audits: Array.from({ length: 2 }),
        },
      ],
    } as ScoredReport).toString();
    expect(md).toMatch(
      /\|\s*Plugin\s*\|\s*Audits\s*\|\s*Version\s*\|\s*Duration\s*\|/,
    );
    expect(md).toMatch(
      /\|\s*Lighthouse\s*\|\s*78\s*\|\s*`1.0.1`\s*\|\s*15.37 s\s*\|/,
    );
    expect(md).toMatch(
      /\|\s*File Size\s*\|\s*2\s*\|\s*`0.3.12`\s*\|\s*260 ms\s*\|/,
    );
  });

  it('should return full about section', () => {
    const md = aboutSection({
      ...baseScoredReport,
      plugins: [
        {
          version: '1.1.1',
          duration: 42,
          title: 'Lighthouse',
          audits: Array.from({ length: 3 }),
        },
      ],
      categories: Array.from({ length: 3 }),
    } as ScoredReport).toString();
    expect(md).toMatchSnapshot();
  });
});

// FULL REPORT

describe('generateMdReport', () => {
  it('should render all sections of the report', () => {
    const md = generateMdReport(baseScoredReport);
    // report title
    expect(md).toMatch('# Code PushUp Report');
    // categories section heading
    expect(md).toMatch(/\|\s*🏷 Category\s*\|\s*⭐ Score\s*\|\s*🛡 Audits\s*\|/);
    // categories section heading
    expect(md).toMatch('## 🏷 Categories');
    // audits heading
    expect(md).toMatch('## 🛡️ Audits');
    // about section heading
    expect(md).toMatch('## About');
    // plugin table
    expect(md).toMatch(
      /\|\s*Plugin\s*\|\s*Audits\s*\|\s*Version\s*\|\s*Duration\s*\|/,
    );
    // made with <3
    expect(md).toMatch('Made with ❤ by [Code PushUp]');
  });

  it('should skip categories section if empty', () => {
    const md = generateMdReport({ ...baseScoredReport, categories: [] });
    expect(md).not.toMatch('## 🏷 Categories');
    expect(md).toMatch('# Code PushUp Report\n\n## 🛡️ Audits');
  });

  it('should render complete md report', () => {
    expect(
      generateMdReport({
        packageName: '@code-pushup/cli',
        version: 'v1.0.0',
        date: 'Wed, Apr 17, 2024, 2:37 PM GMT+2',
        duration: 42_356,
        commit: {
          message: 'ci: update action',
          author: 'Michael <michael.hladky@push-based.io>',
          date: new Date('2025.01.01'),
          hash: '535b8e9e557336618a764f3fa45609d224a62837',
        },
        plugins: [
          {
            date: 'Wed, Apr 17, 2024, 2:38 PM GMT+2',
            slug: 'lighthouse',
            title: 'Lighthouse',
            packageName: '@code-pushup/lighthouse',
            version: '1.0.1.beta-1',
            duration: 17_968,
            icon: 'lighthouse',
            audits: [
              {
                slug: 'largest-contentful-paint',
                title: 'Largest Contentful Paint',
                score: 0.6728,
                value: 2705,
                displayValue: '2,7 s',
                description:
                  'This is the largest contentful element painted within the viewport. [Learn more about the Largest Contentful Paint element](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)',
                docsUrl: 'https://web.dev/lcp',
                details: {
                  table: {
                    columns: [
                      { key: 'phase', label: 'Phase' },
                      {
                        key: 'percentageLcp',
                        label: '% of LCP',
                        align: 'left',
                      },
                      { key: 'timing', label: 'Timing', align: 'right' },
                    ],
                    rows: [
                      {
                        phase: 'TTFB',
                        percentageLcp: '27%',
                        timing: '620 ms',
                      },
                      {
                        phase: 'Load Delay',
                        percentageLcp: '25%',
                        timing: '580 ms',
                      },
                      {
                        phase: 'Load Time',
                        percentageLcp: '41%',
                        timing: '940 ms',
                      },
                      {
                        phase: 'Render Delay',
                        percentageLcp: '6%',
                        timing: '140 ms',
                      },
                    ],
                  },
                },
              },
              {
                slug: 'splash-screen',
                title: 'Splash Screen',
                score: 1,
                value: 1,
              },
              {
                slug: 'fast-images',
                title: 'Fast Images',
                score: 0.97,
                value: 1,
              },
              {
                slug: 'is-crawlable',
                title: 'Website is crawlable',
                score: 0,
                value: 0,
                description:
                  "Search engines are unable to include your pages in search results if they don't have permission to crawl them. [Learn more about crawler directives](https://developer.chrome.com/docs/lighthouse/seo/is-crawlable/).",
              },
            ],
            groups: [
              {
                slug: 'performance-group',
                title: 'Performance Group',
                description: 'Collection of performance focused rules.',
                score: 0,
                docsUrl: 'https://web.dev/lighthouse#performance-group',
                refs: [
                  { slug: 'largest-contentful-paint', weight: 721 },
                  { slug: 'fast-images', weight: 1 },
                ],
              },
            ],
          },
          {
            date: 'Wed, Apr 17, 2024, 2:38 PM GMT+2',
            slug: 'eslint',
            title: 'ESLint',
            packageName: '@code-pushup/eslint',
            version: '3.71.8',
            duration: 17_968,
            icon: 'eslint',
            audits: [
              {
                slug: 'no-explicit-any',
                title: 'No explicit any',
                score: 0,
                value: 63,
                displayValue: '63 errors',
                description: `The any type in TypeScript is a dangerous "escape hatch" from the type system. Using any disables many type checking rules and is generally best used only as a last resort or when prototyping code. This rule reports on explicit uses of the any keyword as a type annotation.

Preferable alternatives to any include:

If the type is known, describing it in an interface or type
If the type is not known, using the safer unknown type
TypeScript's --noImplicitAny compiler option prevents an implied any, but doesn't prevent any from being explicitly used the way this rule does.

\`\`\`ts
.eslintrc.cjs
module.exports = {
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
};
\`\`\`
`,
                docsUrl: 'https://typescript-eslint.io/rules/no-explicit-any/',
                details: {
                  issues: [
                    {
                      severity: 'info',
                      message: 'File `index.js` is 56Kb.',
                      source: {
                        file: 'index.js',
                      },
                    },
                    {
                      severity: 'warning',
                      message: 'Package license is has to be "MIT"',
                      source: {
                        file: 'package.json',
                        position: {
                          startLine: 4,
                        },
                      },
                    },
                    {
                      severity: 'error',
                      message: 'no unused vars',
                      source: {
                        file: 'index.js',
                        position: {
                          startLine: 400,
                          endLine: 200,
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
        categories: [
          {
            title: 'Performance',
            slug: 'performance',
            score: 0.61,
            refs: [
              {
                slug: 'performance-group',
                plugin: 'lighthouse',
                type: 'group',
                weight: 81,
              },
            ],
          },
          {
            title: 'SEO',
            slug: 'seo',
            score: 1,
            isBinary: true,
            refs: [
              {
                slug: 'is-crawlable',
                plugin: 'lighthouse',
                type: 'audit',
                weight: 2,
              },
            ],
          },
          {
            title: 'PWA',
            slug: 'pwa',
            score: 0,
            isBinary: true,
            refs: [
              {
                slug: 'splash-screen',
                plugin: 'lighthouse',
                type: 'audit',
                weight: 1,
              },
            ],
          },
        ],
      }),
    ).toMatchSnapshot();
  });
});
