import { reportsDiffAltMock, reportsDiffMock } from '@code-pushup/test-utils';
import { generateMdReportsDiff } from './generate-md-reports-diff';

describe('generateMdReportsDiff', () => {
  it('should format Markdown comment for improved reports diff', async () => {
    await expect(generateMdReportsDiff(reportsDiffMock())).toMatchFileSnapshot(
      '__snapshots__/report-diff-improved.md',
    );
  });

  it('should format Markdown comment for mixed reports diff', async () => {
    await expect(
      generateMdReportsDiff(reportsDiffAltMock()),
    ).toMatchFileSnapshot('__snapshots__/report-diff-mixed.md');
  });
});
