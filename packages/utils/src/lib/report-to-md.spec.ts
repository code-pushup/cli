import { describe } from 'vitest';
import { report } from '@code-pushup/models/testing';
import { reportToMd } from './report-to-md';

describe('report-to-md', () => {
  it('should contain all sections when using the fixture report', () => {
    const mdReport = reportToMd(report());
    expect(mdReport).toMatchSnapshot(mdReport);
  });
});
