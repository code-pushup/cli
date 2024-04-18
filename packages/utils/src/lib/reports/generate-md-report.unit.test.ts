import { describe, expect, it } from 'vitest';
import { AuditReport, Issue } from '@code-pushup/models';
import {
  getAuditValue,
  getDocsAndDescription,
  renderDetailsAuditValue,
  renderIssuesSection,
  renderTableSection,
  reportToAboutSection,
  reportToDetailsSection,
} from './generate-md-report';
import { ScoredReport } from './types';

describe('getAuditValue', () => {
  it('should return MD format by default', () => {
    expect(getAuditValue({ value: 0 } as AuditReport)).toBe('**0**');
  });

  it('should return HTML format if isHtml is true', () => {
    expect(getAuditValue({ value: 0 } as AuditReport, true)).toBe('<b>0</b>');
  });

  it('should return displayValue if given', () => {
    expect(
      getAuditValue({
        value: 0,
        displayValue: '0ms',
      } as AuditReport),
    ).toBe('**0ms**');
  });
});

describe('getDocsAndDescription', () => {
  it('should return empty string if no options are given', () => {
    expect(getDocsAndDescription({})).toBe('');
  });
  it('should return description if only description is given', () => {
    expect(
      getDocsAndDescription({
        description: 'Audit to track bundle size',
      }),
    ).toBe('Audit to track bundle size\n\n');
  });
  it('should return docsUrl if only docsUrl is given', () => {
    expect(
      getDocsAndDescription({
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }),
    ).toBe('[📖 Docs](http://code-pushup.dev/audits/#lcp)\n\n');
  });

  it('should docs and description if both given', () => {
    expect(
      getDocsAndDescription({
        description: 'Audit to loading performance',
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }),
    ).toBe(
      'Audit to loading performance [📖 Docs](http://code-pushup.dev/audits/#lcp)\n\n',
    );
  });

  it('should have a NEW_LINE if description ends with a code block', () => {
    expect(
      getDocsAndDescription({
        description: 'Audit to loading performance```',
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }),
    ).toBe(
      'Audit to loading performance```\n\n[📖 Docs](http://code-pushup.dev/audits/#lcp)\n\n',
    );
  });
});

describe('reportToAboutSection', () => {
  const baseReport = {
    date: '2025.01.01',
    duration: 4200,
    version: 'v1.0.0',
    commit: {
      message: 'ci: update action',
      author: 'Michael <michael.hladky@push-based.io>',
      date: new Date('2025.01.01'),
      hash: '535b8e9e557336618a764f3fa45609d224a62837',
    },
    plugins: [],
    categories: [],
  };

  it('should return about section with h2', () => {
    const md = reportToAboutSection(baseReport);
    expect(md).toMatch('## About');
  });

  it('should return created by section', () => {
    const md = reportToAboutSection(baseReport);
    expect(md).toMatch(
      'Report was created by [Code PushUp](https://github.com/code-pushup/cli#readme) on Wed, Jan 1, 2025, 12:00 AM UTC.',
    );
  });

  it('should return commit section', () => {
    const md = reportToAboutSection({
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
    expect(md).toMatch('|Commit|Version|Duration|Plugins|Categories|Audits|');
    expect(md).toMatch(
      '|ci: update action (535b8e9e557336618a764f3fa45609d224a62837)|`v1.0.0`|4.20 s|1|3|3|',
    );
  });

  it('should return plugins section with content', () => {
    const md = reportToAboutSection({
      ...baseReport,
      plugins: [
        {
          version: '1.1.1',
          duration: 42,
          title: 'Lighthouse',
          audits: Array.from({ length: 3 }),
        },
      ],
    } as unknown as ScoredReport);
    expect(md).toMatch('The following plugins were run:');
    expect(md).toMatch('|Plugin|Audits|Version|Duration|');
    expect(md).toMatch('|Lighthouse|3|`1.1.1`|42 ms|');
  });

  it('should return full about section', () => {
    const md = reportToAboutSection({
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

describe('renderDetailsTitle', () => {
  it('should include score', () => {
    expect(renderDetailsAuditValue({ score: 0.77 } as AuditReport)).toMatch(
      '(score: 77)',
    );
  });

  it('should include value', () => {
    expect(renderDetailsAuditValue({ value: 125 } as AuditReport)).toMatch(
      '<b>125</b>',
    );
  });

  it('should add score icon for scores at the beginning', () => {
    expect(renderDetailsAuditValue({ score: 0 } as AuditReport)).toMatch(/^🟥/);
  });

  it('should produce full title', () => {
    expect(
      renderDetailsAuditValue({
        score: 1,
        displayValue: '100ms',
      } as AuditReport),
    ).toBe('🟩 <b>100ms</b> (score: 100)');
  });
});

describe('renderIssuesSection', () => {
  it('should render complete section', () => {
    expect(
      renderIssuesSection([
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
    expect(renderIssuesSection()).toBe('');
  });

  it('should include message', () => {
    expect(
      renderIssuesSection([
        { message: 'File `index.js` is 56Kb too big.' } as Issue,
      ]),
    ).toMatch('File `index.js` is 56Kb too big.');
  });

  it('should include correct severity icon', () => {
    expect(renderIssuesSection([{ severity: 'info' } as Issue])).toMatch('ℹ️');
  });

  it('should include source file', () => {
    expect(
      renderIssuesSection([{ source: { file: 'index.js' } } as Issue]),
    ).toMatch('<code>index.js</code>');
  });

  it('should include source position startLine', () => {
    expect(
      renderIssuesSection([
        {
          source: {
            position: {
              startLine: 4,
            },
          },
        } as Issue,
      ]),
    ).toMatch('<td>4</td>');
  });

  it('should include source position startLine and endLine', () => {
    expect(
      renderIssuesSection([
        {
          source: {
            position: {
              startLine: 4,
              endLine: 7,
            },
          },
        } as Issue,
      ]),
    ).toMatch('<td>4-7</td>');
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

describe('reportToDetailsSection', () => {
  it('should only return audit value if no details are given', () => {
    expect(
      reportToDetailsSection({ score: 0, value: 125 } as AuditReport),
    ).toBe('🟥 <b>125</b> (score: 0)');
  });

  it('should wrap "details" into HTML details element if in details are present', () => {
    const md = reportToDetailsSection({
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

  it('should display issue section if in "issues" are present', () => {
    const md = reportToDetailsSection({
      score: 0,
      value: 0,
      details: {
        issues: [{}],
      },
    } as AuditReport);
    expect(md).toMatch('<h4>Issues</h4>');
    expect(md).not.toMatch('<h4>Table</h4>');
  });

  it('should display table section if in "table" is present', () => {
    const md = reportToDetailsSection({
      score: 0,
      value: 0,
      details: {
        table: {
          items: ['1', '2', '3'],
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
    expect(md).toMatch('<h4>Issues</h4>');
    expect(md).not.toMatch('<h4>Table</h4>');
  });

  it('should render complete details section', () => {
    expect(
      reportToDetailsSection({
        slug: 'prefer-design-system-over-css-classes',
        title: 'Prefer the design system over CSS classes',
        score: 0.99,
        displayValue: '190ms',
        details: {
          table: {
            headings: [
              { key: 'classNames', label: 'Class Names' },
              { key: 'element' },
            ],
            items: [
              {
                classNames: '.btn, .icon',
                element: 'button',
              },
            ],
          },
          issues: [
            {
              message: 'Use design system components instead of classes',
              severity: 'error',
            },
          ],
        },
      } as AuditReport),
    ).toMatchSnapshot();
  });
});
