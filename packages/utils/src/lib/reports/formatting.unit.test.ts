import { describe, expect, it } from 'vitest';
import { AuditReport } from '@code-pushup/models';
import { styleBold, tableSection } from './formatting';

describe('styleBold', () => {
  it('should return MD format by default', () => {
    expect(styleBold({ value: 0 } as AuditReport)).toBe('**0**');
  });

  it('should return HTML format if isHtml is true', () => {
    expect(styleBold({ value: 0 } as AuditReport, true)).toBe('<b>0</b>');
  });

  it('should return displayValue if given', () => {
    expect(
      styleBold({
        value: 0,
        displayValue: '0ms',
      } as AuditReport),
    ).toBe('**0ms**');
  });
});

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
        },
        { heading: 'LCP Breakdown:', level: 3 },
      ),
    ).toMatchSnapshot();
  });
});
