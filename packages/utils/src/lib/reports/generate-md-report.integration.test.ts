import { describe } from 'vitest';
import { reportMock } from '@code-pushup/test-utils';
import { generateMdReport } from './generate-md-report';
import { scoreReport } from './scoring';
import { sortReport } from './sorting';

describe('generateMdReport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2021-09-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should contain all sections when using the fixture report', () => {
    const mdReport = generateMdReport(sortReport(scoreReport(reportMock())));
    expect(mdReport).toContain('🏷 Category');
    expect(mdReport).toMatchSnapshot();
  });

  it('should not contain category sections when categories are empty', () => {
    const mdReport = generateMdReport(
      sortReport(scoreReport({ ...reportMock(), categories: [] })),
    );
    expect(mdReport).not.toContain('🏷 Category');
    expect(mdReport).toMatchSnapshot();
  });
});
