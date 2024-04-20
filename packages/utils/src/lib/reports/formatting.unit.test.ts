import { describe, expect, it } from 'vitest';
import { tableSection } from './formatting';

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
