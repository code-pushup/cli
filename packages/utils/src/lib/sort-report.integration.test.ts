import { reportMock } from '@code-pushup/models/testing';
import { scoreReport } from './scoring';
import { sortReport } from './sort-report';

describe('sortReport', () => {
  it('should sort the audits and groups of audits in categories, all audits and nested issues', () => {
    const sortedReport = sortReport(scoreReport(reportMock()));
    expect(sortedReport).toMatchSnapshot();
  });
});
