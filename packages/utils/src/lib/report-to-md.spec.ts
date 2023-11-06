import * as fs from 'fs';
import { describe } from 'vitest';
import { report } from '@code-pushup/models/testing';
import { GITHUB_CLI_REPO_LINK } from './git';
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
      date: '2021-09-10 12:00:00 +0200',
    };
    const mdReport = reportToMd(scoreReport(report()), commit);
    fs.writeFileSync('report.md', mdReport);
    expect(mdReport).toContain(
      `${commit.message} ([${commit.hash.slice(
        0,
        7,
      )}](${GITHUB_CLI_REPO_LINK}/commit/${commit.hash}))`,
    );
    expect(mdReport).toMatchSnapshot();
  });
});
