import { reportsDiffAltMock, reportsDiffMock } from '@code-pushup/test-utils';
import { generateMdReportsDiff } from './generate-md-reports-diff';

describe('generateMdReportsDiff', () => {
  it('should format Markdown comment for improved reports diff', () => {
    expect(generateMdReportsDiff(reportsDiffMock())).toMatchSnapshot();
  });

  it('should format Markdown comment for mixed reports diff', () => {
    expect(generateMdReportsDiff(reportsDiffAltMock())).toMatchSnapshot();
  });
});
