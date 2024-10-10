import { beforeAll, describe, expect, vi } from 'vitest';
import { removeColorCodes, reportMock } from '@code-pushup/test-utils';
import { ui } from '../logging';
import { logStdoutSummary } from './log-stdout-summary';
import { scoreReport } from './scoring';
import { sortReport } from './sorting';

describe('logStdoutSummary', () => {
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

  it('should include all audits when verbose is true', async () => {
    logStdoutSummary(sortReport(scoreReport(reportMock())), true);

    const output = logs.join('\n');

    await expect(removeColorCodes(output)).toMatchFileSnapshot(
      '__snapshots__/report-stdout-verbose.txt',
    );
  });

  it('should indicate that all audits have perfect scores', async () => {
    const report = reportMock();
    const reportWithPerfectScores = {
      ...report,
      plugins: report.plugins.map((plugin, index) => ({
        ...plugin,
        audits: plugin.audits.map(audit => ({
          ...audit,
          score: index === 0 ? 1 : audit.score,
        })),
      })),
    };

    logStdoutSummary(sortReport(scoreReport(reportWithPerfectScores)));

    const output = logs.join('\n');

    expect(output).toContain('All audits have perfect scores');
    await expect(removeColorCodes(output)).toMatchFileSnapshot(
      '__snapshots__/report-stdout-all-perfect-scores.txt',
    );
  });
});
