import { report } from '@code-pushup/models/testing';
import { scoreReport } from './scoring';
import { sortReport } from './sort-report';

describe('sortReport', () => {
  it('should sort the report', () => {
    const sortedReport = sortReport(scoreReport(report()));
    expect(sortedReport).toMatchSnapshot();
  });
});
