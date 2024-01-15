import { describe } from 'vitest';
import { reportMock } from '@code-pushup/testing-utils';
import { generateMdReport } from './generate-md-report';
import { scoreReport } from './scoring';
import { sortReport } from './sorting';

describe('report-to-md', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should contain all sections when using the fixture report', () => {
    const date = new Date('2021-09-15');
    vi.setSystemTime(date);
    const commit = {
      hash: '41682a2fec1d4ece81c696a26c08984baeb4bcf3',
      message: 'refactor(cli): fix exec target',
      author: 'BioPhoton',
      date: 'Sat Sep 10 12:00:00 2021 +0200',
    };
    const mdReport = generateMdReport(
      sortReport(scoreReport(reportMock())),
      commit,
    );
    expect(mdReport).toContain(
      `${commit.message} (${commit.hash.slice(0, 7)})`,
    );
    expect(mdReport).toMatchSnapshot();
  });
});
