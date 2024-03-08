import { describe } from 'vitest';
import { getLogMessages, reportMock } from '@code-pushup/test-utils';
import { ui } from '../logging';
import { logStdoutSummary } from './log-stdout-summary';
import { scoreReport } from './scoring';
import { sortReport } from './sorting';

describe('logStdoutSummary', () => {
  it('should contain all sections when using the fixture report', () => {
    logStdoutSummary(sortReport(scoreReport(reportMock())));
    const output = getLogMessages(ui().logger).join('\n');

    expect(output).toContain('Categories');
    // removes all color codes from the output for snapshot readability
    // eslint-disable-next-line no-control-regex
    expect(output.replace(/\u001B\[\d+m/g, '')).toMatchSnapshot();
  });

  it('should not contain category section when categories are empty', () => {
    logStdoutSummary(
      sortReport(scoreReport({ ...reportMock(), categories: [] })),
    );
    const output = getLogMessages(ui().logger).join('\n');

    expect(output).not.toContain('Categories');
    // removes all color codes from the output for snapshot readability
    // eslint-disable-next-line no-control-regex
    expect(output.replace(/\u001B\[\d+m/g, '')).toMatchSnapshot();
  });
});
