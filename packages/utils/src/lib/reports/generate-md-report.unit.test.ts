import { describe, expect, it } from 'vitest';
import { AuditReport, Issue } from '@code-pushup/models';
import {
  aboutSection,
  auditDetails,
  auditDetailsAuditValue,
  auditDetailsIssues,
  auditsSection,
  categoriesDetails,
  categoryGroupItem,
  categoryRef,
  metaDescription,
  reportHeader,
  reportOverview,
} from './generate-md-report';
import { ScoredGroup, ScoredReport } from './types';

describe('metaDescription', () => {
  it('should return empty string if no options are given', () => {
    expect(metaDescription({})).toBe('');
  });
  it('should return description if only description is given', () => {
    expect(
      metaDescription({
        description: 'Audit to track bundle size',
      }),
    ).toBe('Audit to track bundle size\n\n');
  });
  it('should return docsUrl if only docsUrl is given', () => {
    expect(
      metaDescription({
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }),
    ).toBe('[📖 Docs](http://code-pushup.dev/audits/#lcp)\n\n');
  });

  it('should docs and description if both given', () => {
    expect(
      metaDescription({
        description: 'Audit to loading performance',
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }),
    ).toBe(
      'Audit to loading performance [📖 Docs](http://code-pushup.dev/audits/#lcp)\n\n',
    );
  });

  it('should have a NEW_LINE if description ends with a code block', () => {
    expect(
      metaDescription({
        description: 'Audit to loading performance```',
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }),
    ).toBe(
      'Audit to loading performance```\n\n[📖 Docs](http://code-pushup.dev/audits/#lcp)\n\n',
    );
  });
});

// === Header Section

describe('reportHeader', () => {
  it('should return title as h1', () => {
    expect(reportHeader()).toBe('# Code PushUp Report');
  });
});

// === Categories Overview Section

describe('categoriesSection', () => {
  it('should NOT render categories table', () => {
    const md = reportOverview({
      plugins: [],
      categories: [],
    } as unknown as ScoredReport);
    expect(md).toBe('');
  });
  it('should render complete categories table', () => {
    expect(
      reportOverview({
        plugins: [
          {
            slug: 'eslint',
            title: 'Eslint',
          },
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
          },
        ],
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 0.98,
            refs: [{ slug: 'no-let', type: 'audit' }],
          },
          {
            slug: 'performance',
            title: 'Performance',
            score: 0.74,
            refs: [{ slug: 'largest-contentful-paint', type: 'audit' }],
          },
          {
            slug: 'typescript',
            title: 'Typescript',
            score: 0.14,
            refs: [{ slug: 'no-any', type: 'audit' }],
          },
        ],
      } as unknown as ScoredReport),
    ).toMatchSnapshot();
  });
});

// === Categories Details

describe('categoryRef', () => {
  it('should render partial category reference', () => {
    expect(
      categoryRef(
        {
          slug: 'score-report-performance',
          title: 'Score Report Performance',
          value: 12_245,
          score: 1,
        },
        'lighthouse',
      ),
    ).toBe(
      '- 🟩 [Score Report Performance](#score-report-performance-lighthouse) (_lighthouse_) - **12245**',
    );
  });
  it('should render complete category reference', () => {
    expect(
      categoryRef(
        {
          slug: 'score-report-performance',
          title: 'Score Report Performance',
          value: 1,
          score: 0,
          displayValue: '12 errors',
        },
        'lighthouse',
      ),
    ).toBe(
      '- 🟥 [Score Report Performance](#score-report-performance-lighthouse) (_lighthouse_) - **12 errors**',
    );
  });
});

describe('categoryGroupItem', () => {
  it('should render partial category reference', () => {
    expect(
      categoryGroupItem(
        {
          slug: 'bug-prevention',
          title: 'Bug Prevention',
          score: 0.9,
        } as ScoredGroup,
        [
          { title: 'No let', slug: 'no-let', score: 0, value: 23 },
          { title: 'No any', slug: 'no-any', score: 0.6, value: 91 },
        ],
        'Eslint',
      ),
    ).toMatchSnapshot('');
  });

  it('should render complete category reference', () => {
    expect(
      categoryGroupItem(
        {
          slug: 'bug-prevention',
          title: 'Bug Prevention',
          score: 0.6,
        } as ScoredGroup,
        [
          {
            title: 'No any',
            slug: 'no-any',
            score: 0,
            value: 12,
            displayValue: '12 errors',
          },
          { title: 'No let', slug: 'no-let', score: 1, value: 0 },
        ],
        'Eslint',
      ),
    ).toMatchSnapshot();
  });
});

describe('categoriesDetails', () => {
  it('should render complete categories details', () => {
    expect(
      categoriesDetails({
        plugins: [
          {
            slug: 'eslint',
            title: 'Eslint',
            audits: [
              { slug: 'no-let', title: 'No let', score: 0, value: 5 },
              { slug: 'no-any', title: 'No any', score: 1, value: 0 },
            ],
          },
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
            audits: [
              {
                slug: 'largest-contentful-paint',
                title: 'Largest Contentful Paint',
                score: 0.7,
                value: 2905,
              },
            ],
          },
        ],
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 0.98,
            refs: [{ slug: 'no-let', type: 'audit', plugin: 'eslint' }],
          },
          {
            slug: 'performance',
            title: 'Performance',
            score: 0.74,
            refs: [
              {
                slug: 'largest-contentful-paint',
                type: 'audit',
                plugin: 'lighthouse',
              },
            ],
          },
          {
            slug: 'typescript',
            title: 'Typescript',
            score: 0.14,
            refs: [{ slug: 'no-any', type: 'audit', plugin: 'eslint' }],
          },
        ],
      } as unknown as ScoredReport),
    ).toMatchSnapshot();
  });
});

// === Audit Details

describe('auditDetailsAuditValue', () => {
  it('should include score', () => {
    expect(auditDetailsAuditValue({ score: 0.77 } as AuditReport)).toMatch(
      '(score: 77)',
    );
  });

  it('should include value', () => {
    expect(auditDetailsAuditValue({ value: 125 } as AuditReport)).toMatch(
      '<b>125</b>',
    );
  });

  it('should add score icon for scores at the beginning', () => {
    expect(auditDetailsAuditValue({ score: 0 } as AuditReport)).toMatch(/^🟥/);
  });

  it('should include both display value and score when provided', () => {
    expect(
      auditDetailsAuditValue({
        score: 1,
        displayValue: '100ms',
      } as AuditReport),
    ).toBe('🟩 <b>100ms</b> (score: 100)');
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
      ]),
    ).toMatchSnapshot();
  });

  it('should return empty string for missing issues', () => {
    expect(auditDetailsIssues()).toBe('');
  });

  it('should include message', () => {
    expect(
      auditDetailsIssues([
        { message: 'File `index.js` is 56Kb too big.' } as Issue,
      ]),
    ).toMatch('File `index.js` is 56Kb too big.');
  });

  it('should include correct severity icon', () => {
    expect(auditDetailsIssues([{ severity: 'info' } as Issue])).toMatch('ℹ️');
  });

  it('should include source file', () => {
    expect(
      auditDetailsIssues([{ source: { file: 'index.js' } } as Issue]),
    ).toMatch('<code>index.js</code>');
  });

  it('should include source position startLine', () => {
    expect(
      auditDetailsIssues([
        {
          source: {
            position: {
              startLine: 4,
            },
          },
        } as Issue,
      ]),
    ).toMatch('|4|');
  });

  it('should include source position startLine and endLine', () => {
    expect(
      auditDetailsIssues([
        {
          source: {
            position: {
              startLine: 4,
              endLine: 7,
            },
          },
        } as Issue,
      ]),
    ).toMatch('|4-7|');
  });
});

describe('renderTableSection', () => {
  it('should render complete section', () => {
    expect(
      renderTableSection({
        headings: [
          { key: 'phase', label: 'Phase' },
          { key: 'percentageLcp', label: '% of LCP' },
          { key: 'timing', label: 'Timing' },
        ],
        items: [
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
      }),
    ).toMatchSnapshot();
  });
});

describe('auditDetails', () => {
  it('should only return audit value if no details are given', () => {
    expect(auditDetails({ score: 0, value: 125 } as AuditReport)).toBe(
      '🟥 <b>125</b> (score: 0)',
    );
  });

  it('should wrap details into an HTML details element if details are present', () => {
    const md = auditDetails({
      score: 0,
      value: 0,
      details: {
        issues: [{}],
      },
    } as AuditReport);
    expect(md).toMatch('<details>');
    expect(md).toMatch('<summary>🟥 <b>0</b> (score: 0)</summary>');
    expect(md).toMatch('</details>');
  });

  it('should display issue section if issues are present', () => {
    const md = auditDetails({
      score: 0,
      value: 0,
      details: {
        issues: [{}],
      },
    } as AuditReport);
    expect(md).toMatch('#### Issues');
    expect(md).not.toMatch('#### Table');
  });

  it('should display table section if table is present', () => {
    const md = auditDetails({
      score: 0,
      value: 0,
      details: {
        table: {
          rows: [['1', '2', '3']],
        },
        issues: [
          {
            message: '',
            severity: 'info',
            source: { file: '' },
          },
        ],
      },
    } as AuditReport);
    expect(md).toMatch('#### Issues');
    expect(md).not.toMatch('#### Table');
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
            headings: [
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
      } as AuditReport),
    ).toMatchSnapshot();
  });
});

describe('auditsSection', () => {
  it('should render section heading', () => {
    expect(
      auditsSection({
        plugins: [
          {
            audits: [],
          },
        ],
      } as unknown as ScoredReport),
    ).toMatch('## 🛡️ Audits');
  });

  it('should render audit result', () => {
    expect(
      auditsSection({
        plugins: [{ audits: [{ score: 1, value: 0 }] }],
      } as ScoredReport),
    ).toMatch('🟩 <b>0</b> (score: 100)');
  });

  it('should render audit details', () => {
    const md = auditsSection({
      plugins: [
        {
          audits: [
            {
              details: {
                issues: [{ source: {} }],
                table: { rows: [{ value: 42 }] },
              },
            },
          ],
        },
      ],
    } as unknown as ScoredReport);
    expect(md).toMatch('#### Issues');
    expect(md).toMatch('|Severity|Message|Source file|Line(s)|');
    expect(md).toMatch('#### Additional Information');
    expect(md).toMatch('|value|');
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
      } as ScoredReport),
    ).toMatch('Measures responsiveness. [📖 Docs](https://web.dev/inp)');
  });

  it('should render complete audit section', () => {
    expect(
      auditsSection({
        plugins: [
          {
            slug: 'eslint',
            title: 'Eslint',
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
      } as ScoredReport),
    ).toMatchSnapshot();
  });
});

// === About

describe('aboutSection', () => {
  const baseReport = {
    date: '2025.01.01',
    duration: 4200,
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
        version: '1.0.1',
        duration: 15_365,
        title: 'Lighthouse',
        audits: Array.from({ length: 78 }),
      },
    ],
    categories: [],
  };

  it('should return about section with h2 and created by in plain test', () => {
    const md = aboutSection(baseReport);
    expect(md).toMatch('## About');
    expect(md).toMatch(
      'Report was created by [Code PushUp](https://github.com/code-pushup/cli#readme) on Wed, Jan 1, 2025, 12:00 AM UTC.',
    );
  });

  it('should return commit section', () => {
    const md = aboutSection({
      ...baseReport,
      plugins: [
        {
          version: '1.1.1',
          duration: 4200,
          title: 'Lighthouse',
          audits: Array.from({ length: 3 }),
        },
      ],
      categories: Array.from({ length: 3 }),
    } as unknown as ScoredReport);
    expect(md).toMatch('### Report overview:');
    expect(md).toMatch('|Commit|Version|Duration|Plugins|Categories|Audits|');
    expect(md).toMatch(
      '|ci: update action (535b8e9e557336618a764f3fa45609d224a62837)|`v1.0.0`|4.20 s|1|3|3|',
    );
  });

  it('should return plugins section with content', () => {
    const md = aboutSection({
      ...baseReport,
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
    } as unknown as ScoredReport);
    expect(md).toMatch('### Plugins overview:');
    expect(md).toMatch('|Plugin|Audits|Version|Duration|');
    expect(md).toMatch('|Lighthouse|78|`1.0.1`|15.37 s|');
    expect(md).toMatch('|File Size|2|`0.3.12`|260 ms|');
  });

  it('should return full about section', () => {
    const md = aboutSection({
      ...baseReport,
      plugins: [
        {
          version: '1.1.1',
          duration: 42,
          title: 'Lighthouse',
          audits: Array.from({ length: 3 }),
        },
      ],
      categories: Array.from({ length: 3 }),
    } as ScoredReport);
    expect(md).toMatchSnapshot();
  });
});
