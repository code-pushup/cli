import { describe } from 'vitest';
import { report } from '@code-pushup/models/testing';
import { reportToMd } from './report-to-md';
import { scoreReport } from './scoring';

describe('report-to-md', () => {
  it('should contain all sections when using the fixture report', () => {
    const mdReport = reportToMd(scoreReport(report()));
    expect(mdReport).toMatchSnapshot(mdReport);
  });
});
