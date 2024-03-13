import { reportsDiffMock } from '@code-pushup/test-utils';
import { generateMdReportsDiff } from './generate-md-reports-diff';

describe('generateMdReportsDiff', () => {
  it('should format Markdown comment summarizing changes between reports', () => {
    expect(generateMdReportsDiff(reportsDiffMock())).toMatchSnapshot();
  });
});
