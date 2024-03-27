import { beforeAll, describe, expect, vi } from 'vitest';
import { reportMock } from '@code-pushup/test-utils';
import { ui } from '../logging';
import { logStdoutSummary } from './log-stdout-summary';
import { scoreReport } from './scoring';
import { sortReport } from './sorting';

describe('logStdoutSummary', () => {
  // removes all color codes from the output for snapshot readability
  const removeColorCodes = (stdout: string) =>
    // eslint-disable-next-line no-control-regex
    stdout.replace(/\u001B\[\d+m/g, '');

  let logs: string[];

  beforeAll(() => {
    logs = [];
    // console.log is used inside the logger when in "normal" mode
    vi.spyOn(console, 'log').mockImplementation(msg => {
      logs = [...logs, msg];
    });
    // we want to see table and sticker logs in the final style ("raw" don't show borders etc so we use `console.log` here)
    ui().switchMode('normal');
  });

  afterEach(() => {
    logs = [];
  });

  afterAll(() => {
    ui().switchMode('raw');
  });

  it('should contain all sections when using the fixture report', async () => {
    logStdoutSummary(sortReport(scoreReport(reportMock())));

    const output = logs.join('\n');

    expect(output).toContain('Categories');
    await expect(removeColorCodes(output)).toMatchFileSnapshot(
      '__snapshots__/report-stdout.txt',
    );
  });

  it('should not contain category section when categories are empty', async () => {
    logStdoutSummary(
      sortReport(scoreReport({ ...reportMock(), categories: [] })),
    );
    const output = logs.join('\n');

    expect(output).not.toContain('Categories');
    await expect(removeColorCodes(output)).toMatchFileSnapshot(
      '__snapshots__/report-stdout-no-categories.txt',
    );
  });
});
