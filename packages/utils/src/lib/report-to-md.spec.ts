import { describe } from 'vitest';
import { report } from '@code-pushup/models/testing';
import { reportToMd } from './report-to-md';
import { scoreReport } from './scoring';

describe('report-to-md', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should contain all sections when using the fixture report', () => {
    const date = new Date(2000, 0, 1, 0);
    vi.setSystemTime(date);
    const mdReport = reportToMd(scoreReport(report()));
    expect(mdReport).toMatchSnapshot(mdReport);
  });
});
