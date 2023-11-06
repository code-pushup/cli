import { describe } from 'vitest';
import { report } from '@code-pushup/models/testing';
import { reportToStdout } from './report-to-stdout';
import { scoreReport } from './scoring';

describe('report-to-stdout', () => {
  it('should contain all sections when using the fixture report', () => {
    const logOutput = reportToStdout(scoreReport(report()));
    // eslint-disable-next-line no-control-regex
    expect(logOutput.replace(/\u001B\[\d+m/g, '')).toMatchSnapshot();
  });
});
