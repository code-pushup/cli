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
    const commit = {
      hash: '41682a2fec1d4ece81c696a26c08984baeb4bcf3',
      message: 'refactor(cli): fix exec target',
      author: 'BioPhoton',
      date: 'Sat Sep 10 12:00:00 2021 +0200',
    };
    const mdReport = reportToMd(scoreReport(report()), commit);
    expect(mdReport).toContain(
      `${commit.message} (${commit.hash.slice(0, 7)})`,
    );
    expect(mdReport).toMatchSnapshot();
  });
});
