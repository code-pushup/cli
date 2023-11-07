import { afterEach, beforeEach, describe } from 'vitest';
import { minimalReport } from '@code-pushup/models/testing';
import { mockConsole, unmockConsole } from '../../test';
import { reportToStdout } from './report-to-stdout';
import { scoreReport } from './scoring';

let logs: string[];

describe('report-to-stdout', () => {
  beforeEach(async () => {
    logs = [];
    mockConsole(msg => logs.push(msg));
  });
  afterEach(() => {
    unmockConsole();
  });

  it('should contain all sections when using the fixture report', () => {
    reportToStdout(scoreReport(minimalReport('tmp')));
    const logOutput = logs.join('\n');
    expect(logOutput).toMatchSnapshot();
  });
});
