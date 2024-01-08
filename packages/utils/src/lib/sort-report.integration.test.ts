import { REPORT_MOCK } from '@code-pushup/testing-utils';
import { scoreReport } from './scoring';
import { sortReport } from './sort-report';

describe('sortReport', () => {
  it('should sort the audits and groups of audits in categories, all audits and nested issues', () => {
    const sortedReport = sortReport(scoreReport(REPORT_MOCK));
    expect(sortedReport).toMatchSnapshot();
  });
});
