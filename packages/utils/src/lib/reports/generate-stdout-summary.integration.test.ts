import { describe } from 'vitest';
import { reportMock } from '@code-pushup/test-utils';
import { generateStdoutSummary } from './generate-stdout-summary';
import { scoreReport } from './scoring';
import { sortReport } from './sorting';

describe('generateStdoutSummary', () => {
  // removes all color codes from the output for snapshot readability
  const removeColorCodes = (stdout: string) =>
    // eslint-disable-next-line no-control-regex
    stdout.replace(/\u001B\[\d+m/g, '');

  it('should contain all sections when using the fixture report', async () => {
    const logOutput = generateStdoutSummary(
      sortReport(scoreReport(reportMock())),
    );

    expect(logOutput).toContain('Categories');
    await expect(removeColorCodes(logOutput)).toMatchFileSnapshot(
      '__snapshots__/report-stdout.txt',
    );
  });

  it('should not contain category section when categories are empty', async () => {
    const logOutput = generateStdoutSummary(
      sortReport(scoreReport({ ...reportMock(), categories: [] })),
    );

    expect(logOutput).not.toContain('Categories');
    await expect(removeColorCodes(logOutput)).toMatchFileSnapshot(
      '__snapshots__/report-stdout-no-categories.txt',
    );
  });
});
