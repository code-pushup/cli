import { describe, expect, it } from 'vitest';
import { metaDescription, tableSection } from './formatting';
import { NEW_LINE } from './md';

describe('tableSection', () => {
  it('should render complete section', () => {
    expect(
      tableSection(
        {
          headings: [
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
          alignment: ['c', 'l', 'r'],
        },
        { heading: 'LCP Breakdown', level: 3 },
      ),
    ).toMatchSnapshot();
  });
});

describe('metaDescription', () => {
  it('should return empty string if no options are given', () => {
    expect(metaDescription({})).toBe('');
  });

  it('should return description if only description is given', () => {
    expect(
      metaDescription({
        description: 'Audit to track bundle size',
      }),
    ).toBe(`Audit to track bundle size${NEW_LINE}`);
  });

  it('should return docsUrl if only docsUrl is given', () => {
    expect(
      metaDescription({
        docsUrl: `http://code-pushup.dev/audits/#lcp`,
      }),
    ).toBe(`[📖 Docs](http://code-pushup.dev/audits/#lcp)${NEW_LINE}`);
  });

  it('should docs and description if both given', () => {
    expect(
      metaDescription({
        description: 'Audit for loading performance',
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }),
    ).toBe(
      `Audit for loading performance [📖 Docs](http://code-pushup.dev/audits/#lcp)${NEW_LINE}`,
    );
  });

  it('should include additional empty lines if description ends with a code block', () => {
    expect(
      metaDescription({
        description: 'Audit to loading performance```',
        docsUrl: 'http://code-pushup.dev/audits/#lcp',
      }),
    ).toBe(
      `Audit to loading performance\`\`\`${NEW_LINE}${NEW_LINE}[📖 Docs](http://code-pushup.dev/audits/#lcp)${NEW_LINE}`,
    );
  });
});
