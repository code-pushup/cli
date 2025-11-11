import { beforeAll, describe, expect, vi } from 'vitest';
import { removeColorCodes, reportMock } from '@code-pushup/test-utils';
import { logger } from '../logger.js';
import { ui } from '../logging.js';
import { logStdoutSummary } from './log-stdout-summary.js';
import { scoreReport } from './scoring.js';
import { sortReport } from './sorting.js';

describe('logStdoutSummary', () => {
  let stdout: string;

  beforeAll(() => {
    vi.mocked(logger.info).mockImplementation(message => {
      stdout += `${message}\n`;
    });
    vi.mocked(logger.newline).mockImplementation(() => {
      stdout += '\n';
    });
    // console.log is used inside the @poppinss/cliui logger when in "normal" mode
    vi.spyOn(console, 'log').mockImplementation(message => {
      stdout += `${message}\n`;
    });
    // we want to see table and sticker logs in the final style ("raw" don't show borders etc so we use `console.log` here)
    ui().switchMode('normal');
  });

  beforeEach(() => {
    stdout = '';
    logger.setVerbose(false);
  });

  afterAll(() => {
    ui().switchMode('raw');
  });

  it('should contain all sections when using the fixture report', async () => {
    logStdoutSummary(sortReport(scoreReport(reportMock())));

    expect(stdout).toContain('Categories');
    await expect(removeColorCodes(stdout)).toMatchFileSnapshot(
      '__snapshots__/report-stdout.txt',
    );
  });

  it('should not contain category section when categories are missing', async () => {
    logStdoutSummary(
      sortReport(scoreReport({ ...reportMock(), categories: undefined })),
    );

    expect(stdout).not.toContain('Categories');
    await expect(removeColorCodes(stdout)).toMatchFileSnapshot(
      '__snapshots__/report-stdout-no-categories.txt',
    );
  });

  it('should include all audits when verbose is true', async () => {
    logger.setVerbose(true);

    logStdoutSummary(sortReport(scoreReport(reportMock())));

    await expect(removeColorCodes(stdout)).toMatchFileSnapshot(
      '__snapshots__/report-stdout-verbose.txt',
    );
  });

  it('should indicate that all audits have perfect scores', async () => {
    const report = reportMock();
    const reportWithPerfectScores = {
      ...report,
      plugins: report.plugins.map((plugin, index) =>
        index > 0
          ? plugin
          : {
              ...plugin,
              audits: plugin.audits.map(audit => ({ ...audit, score: 1 })),
            },
      ),
    };

    logStdoutSummary(sortReport(scoreReport(reportWithPerfectScores)));

    expect(stdout).toContain('All 47 audits have perfect scores');
    await expect(removeColorCodes(stdout)).toMatchFileSnapshot(
      '__snapshots__/report-stdout-all-perfect-scores.txt',
    );
  });
});
