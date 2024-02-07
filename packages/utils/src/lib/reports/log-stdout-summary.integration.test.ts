import {beforeAll, beforeEach, describe} from 'vitest';
import { reportMock } from '@code-pushup/testing-utils';
import { logStdoutSummary } from './log-stdout-summary';
import { scoreReport } from './scoring';
import { sortReport } from './sorting';
import {ui} from "../logging";

describe('generateStdoutSummary', () => {
  beforeAll(() => {
    ui().switchMode('raw');
  })
  beforeEach(() => {
   ui().flushLogs();
  })
  it('should contain all sections when using the fixture report', () => {
    logStdoutSummary(sortReport(scoreReport(reportMock())));
    const output = ui().logger.getRenderer().getLogs().map(({message}) => message).join('\n');

    expect(output).toContain('Categories');
    // removes all color codes from the output for snapshot readability
    // eslint-disable-next-line no-control-regex
    expect(output.replace(/\u001B\[\d+m/g, '')).toMatchSnapshot();
  });

  it('should not contain category section when categories are empty', () => {
    logStdoutSummary(
      sortReport(scoreReport({ ...reportMock(), categories: [] })),
    );
    const output = ui().logger.getRenderer().getLogs().map(({message}) => message).join('\n');

    expect(output).not.toContain('Categories');
    // removes all color codes from the output for snapshot readability
    // eslint-disable-next-line no-control-regex
    expect(output.replace(/\u001B\[\d+m/g, '')).toMatchSnapshot();
  });
});
